// ============================================================
// DSU ACADEMY LINE OA — Code.gs
// PAPRAI Platform | โรงเรียนสาธิต ม.ศิลปากร (มัธยมศึกษา)
// Version: 2.0.0 — Registration, Voting, News Feed
// ============================================================
// Section 1  : doPost() / doGet()
// Section 2  : processEvent()
// Section 3  : Role Resolver
// Section 4  : Event Handlers (Follow, Unfollow, Text, Postback)
// Section 5  : Admin Command Handlers
// Section 6  : Registration Flow (State Machine)
// Section 7  : FAQ Pipeline (Layer 1 / 2 / 3)
// Section 8  : Voting System
// Section 9  : News Feed & Events
// Section 10 : Segment & Rich Menu
// Section 11 : LINE API Layer
// Section 12 : Sheets Layer (LockService)
// Section 13 : Rate Limiting & Language Detection
// Section 14 : State Machine Helpers
// ============================================================


// ============================================================
// SECTION 1: WEBHOOK ENTRY POINT
// ============================================================

function doPost(e) {
  const response = ContentService
    .createTextOutput(JSON.stringify({ status:'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
  try {
    if (!e || !e.postData || !e.postData.contents) return response;
    const body = JSON.parse(e.postData.contents);
    if (!body.events || body.events.length === 0) return response;
    body.events.forEach(event => {
      try { processEvent(event); }
      catch(err) { logInfo('doPost',`ERROR [${event.type}]`,err.message); }
    });
  } catch(err) { logInfo('doPost','FATAL',err.message); }
  return response;
}

function doGet() {
  const check = validateSetup();
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  check.valid ? 'running' : 'misconfigured',
      bot:     BOT_CONFIG.BOT_NAME,
      version: BOT_CONFIG.VERSION,
      issues:  check.issues || [],
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// SECTION 2: EVENT ROUTER
// ============================================================

function processEvent(event) {
  const userId = event.source && event.source.userId;
  if (!userId) return;
  if (event.source && event.source.type !== 'user') return;

  switch (event.type) {
    case 'follow':
      handleFollowEvent(event.replyToken, userId); break;
    case 'unfollow':
      handleUnfollowEvent(userId); break;
    case 'message':
      if (event.message && event.message.type === 'text')
        handleTextMessage(event, userId);
      break;
    case 'postback':
      handlePostbackEvent(event, userId); break;
    default:
      logInfo('processEvent',`Unhandled: ${event.type}`);
  }
}


// ============================================================
// SECTION 3: ROLE RESOLVER
// ============================================================

function resolveUserRole(userId) {
  const props = getProps();

  if (userId === props.SUPER_ADMIN_ID)
    return { role:SYSTEM_CONFIG.ROLE.SUPER_ADMIN, segment:null, profile:null };

  if (Array.isArray(props.ADMIN_IDS) && props.ADMIN_IDS.includes(userId))
    return { role:SYSTEM_CONFIG.ROLE.ADMIN, segment:null, profile:null };

  // CacheService ก่อน
  const cacheKey = SYSTEM_CONFIG.CACHE.USER_ROLE_PREFIX + userId;
  const cached   = CacheService.getScriptCache().get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    return { role:parsed.role, segment:parsed.segment, profile:parsed.profile };
  }

  // Sheets
  const profile = getUserProfile(userId);
  const segment = profile ? (profile.segment || SYSTEM_CONFIG.ROLE.VISITOR) : SYSTEM_CONFIG.ROLE.VISITOR;
  const result  = { role:segment, segment, profile };
  CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), SYSTEM_CONFIG.CACHE.ROLE_TTL);
  return result;
}

function isAdminRole(role) {
  return role === SYSTEM_CONFIG.ROLE.SUPER_ADMIN || role === SYSTEM_CONFIG.ROLE.ADMIN;
}

function isRegistered(segment) {
  return ['teacher','staff','student','parent'].includes(segment);
}

function clearUserRoleCache(userId) {
  CacheService.getScriptCache().remove(SYSTEM_CONFIG.CACHE.USER_ROLE_PREFIX + userId);
}


// ============================================================
// SECTION 4: EVENT HANDLERS
// ============================================================

// ─── 4.1 Follow ──────────────────────────────────────────────
function handleFollowEvent(replyToken, userId) {
  logInfo('Follow', userId);

  const roleInfo = resolveUserRole(userId);

  // Admin
  if (isAdminRole(roleInfo.role)) {
    _updateLastActive(userId);
    const pending = _getPendingCounts();
    replyMessage(replyToken, [
      { type:'text', text:MESSAGES.ADMIN_WELCOME },
      buildAdminPanelFlex(pending.broadcasts, pending.pushes, pending.polls),
    ]);
    return;
  }

  // ตรวจ Auto-match ใน Teacher_Registry
  const teacherMatch = _findTeacherByUserId(userId);
  if (teacherMatch) {
    // เคย Add Friend แล้วและมี userId ในระบบ — welcome back
    const title = teacherMatch.position === 'staff' ? 'คุณ' : 'อาจารย์';
    _ensureUserProfile(userId, teacherMatch.fullName, teacherMatch.position === 'staff' ? 'staff' : 'teacher');
    replyMessage(replyToken, [{
      type:'text',
      text: teacherMatch.position === 'staff'
        ? MESSAGES.WELCOME_STAFF(teacherMatch.firstName)
        : MESSAGES.WELCOME_TEACHER(teacherMatch.firstName),
      quickReply:_mainQuickReply(),
    }]);
    return;
  }

  // ตรวจ Auto-match ใน Student_Registry
  const studentMatch = _findStudentByUserId(userId);
  if (studentMatch) {
    _ensureUserProfile(userId, studentMatch.fullName, 'student');
    replyMessage(replyToken, [{
      type:'text',
      text:MESSAGES.WELCOME_STUDENT(studentMatch.firstName, studentMatch.class, studentMatch.room),
      quickReply:_mainQuickReply(),
    }]);
    return;
  }

  // ผู้ใช้ใหม่ / ยังไม่ลงทะเบียน
  const displayName = (() => {
    try { const p = getLineProfile(userId); return p ? p.displayName : ''; } catch(e) { return ''; }
  })();

  saveUserProfile({ userId, displayName, segment:'visitor', richMenuId:getProps().RICH_MENU_VISITOR||'',
                    language:'th', joinDate:new Date(), lastActive:new Date(), status:'active' });

  replyMessage(replyToken, [
    { type:'text', text:MESSAGES.WELCOME_VISITOR },
    buildSegmentSelectFlex(),
  ]);
}


// ─── 4.2 Unfollow ────────────────────────────────────────────
function handleUnfollowEvent(userId) {
  logInfo('Unfollow', userId);
  try {
    const sheet   = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const data    = sheet.getDataRange().getValues();
    const cols    = _headerMap(data[0], ['userId','status']);
    for (let i = 1; i < data.length; i++) {
      if (data[i][cols.userId] === userId) {
        const lock = LockService.getScriptLock();
        try { lock.waitLock(10000); sheet.getRange(i+1, cols.status+1).setValue('blocked'); }
        finally { lock.releaseLock(); }
        break;
      }
    }
    clearUserRoleCache(userId);
  } catch(e) { logInfo('Unfollow','ERROR',e.message); }
}


// ─── 4.3 Text Message ────────────────────────────────────────
function handleTextMessage(event, userId) {
  const replyToken = event.replyToken;
  const message    = event.message.text.trim();
  const startTime  = Date.now();

  logInfo('Text', `[${userId}] "${message.substring(0,50)}"`);

  const roleInfo = resolveUserRole(userId);
  const segment  = roleInfo.segment || SYSTEM_CONFIG.ROLE.VISITOR;

  // [1] Escape Keywords
  if (SYSTEM_CONFIG.ESCAPE_KEYWORDS.some(kw => message.toLowerCase() === kw.toLowerCase())) {
    clearRegState(userId);
    clearAdminState(userId);
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.CANCELLED }]);
    return;
  }

  // [2] Registration State — ตรวจก่อนทุกอย่าง
  const regState = getRegState(userId);
  if (regState && regState.state !== SYSTEM_CONFIG.REG_STATE.IDLE) {
    handleRegistrationInput(replyToken, userId, message, regState);
    return;
  }

  // [3] Admin
  if (isAdminRole(roleInfo.role)) {
    handleAdminTextMessage(replyToken, userId);
    return;
  }

  // [4] Visitor Rate Limit (5/วัน)
  if (segment === SYSTEM_CONFIG.ROLE.VISITOR) {
    const limitResult = checkVisitorRateLimit(userId);
    if (!limitResult.allowed) {
      replyMessage(replyToken, [
        { type:'text', text:MESSAGES.VISITOR_LIMIT_REACHED },
        buildSegmentSelectFlex(),
      ]);
      return;
    }
    // Warning เมื่อเหลือน้อย
    if (limitResult.remaining <= 2 && limitResult.remaining > 0) {
      // ส่ง warning ก่อน แต่ยังตอบคำถามได้
    }
  } else {
    // Registered rate limit (30/วัน)
    if (BOT_CONFIG.ENABLE_RATE_LIMIT && !checkRateLimit(userId)) {
      replyMessage(replyToken, [{ type:'text', text:MESSAGES.ERROR_RATE_LIMIT }]);
      return;
    }
  }

  // [5] Help / Menu keywords
  const helpKws = ['/help','help','ช่วยเหลือ','เมนู','menu','/menu'];
  if (helpKws.some(kw => message.toLowerCase() === kw.toLowerCase())) {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.HELP_MENU, quickReply:_helpQuickReply(segment) }]);
    return;
  }

  // [6] Special keyword routing (ต้องลงทะเบียนแล้วเท่านั้น บางฟีเจอร์)
  const msgLower = message.toLowerCase();

  if (['โหวต','vote','poll','ร่วมโหวต'].some(kw => msgLower.includes(kw))) {
    handleVoteRequest(replyToken, userId, segment);
    return;
  }
  if (['ข่าว','news','ข่าวสาร','ข่าวโรงเรียน'].some(kw => msgLower.includes(kw))) {
    handleNewsRequest(replyToken, userId);
    return;
  }
  if (['กิจกรรม','event','events','ประกาศ'].some(kw => msgLower.includes(kw))) {
    handleEventsRequest(replyToken, userId, segment);
    return;
  }

  // [7] Language Detection
  const language = BOT_CONFIG.ENABLE_LANG_DETECT ? detectLanguage(message) : 'th';

  // [8] FAQ Pipeline (3 Layers)
  const profile      = getUserProfile(userId);
  const regSegment   = (profile && profile.segment) || SYSTEM_CONFIG.ROLE.VISITOR;
  const userContext  = _buildUserContext(profile, regSegment);
  let   botReply     = null;
  let   source       = 'fallback';
  let   category     = '';

  // Layer 1: Keyword Match
  const l1 = layer1_keywordMatch(message);
  if (l1) {
    botReply = l1.answer; source = 'keyword'; category = l1.category;
    logInfo('FAQ','L1 hit', l1.faqId);
  }

  // Layer 2: Category → Targeted LLM
  if (!botReply) {
    const l2 = layer2_categoryMatch(message);
    if (l2) {
      try {
        const faqCtx = buildFaqContext(l2.category);
        const prompt = buildFaqSystemPrompt(faqCtx, language, regSegment, l2.promptHint, userContext);
        botReply     = _callLLM(getProps(), prompt, message, BOT_CONFIG.AI_MAX_TOKENS);
        source = 'llm_targeted'; category = l2.category;
        logInfo('FAQ','L2 targeted', l2.category);
      } catch(e) { logInfo('FAQ','L2 error',e.message); }
    }
  }

  // Layer 3: Full FAQ → LLM
  if (!botReply) {
    try {
      const faqCtx = buildFaqContext(null);
      const prompt = buildFaqSystemPrompt(faqCtx, language, regSegment, null, userContext);
      botReply     = _callLLM(getProps(), prompt, message, BOT_CONFIG.AI_MAX_TOKENS);
      source = 'llm_full';
      logInfo('FAQ','L3 full');
    } catch(e) { logInfo('FAQ','L3 error',e.message); }
  }

  // Fallback
  if (!botReply || botReply.trim() === '') {
    botReply = language === 'en' ? MESSAGES.FALLBACK_EN : MESSAGES.FALLBACK_TH;
    source   = 'fallback';
  }

  // [9] Reply + Quick Reply
  const qr = segment === SYSTEM_CONFIG.ROLE.VISITOR
    ? _visitorQuickReply(checkVisitorRateLimit(userId).remaining)
    : _mainQuickReply();

  replyMessage(replyToken, [{ type:'text', text:botReply, quickReply:qr }]);

  // [10] Log
  const responseMs = Date.now() - startTime;
  _updateLastActive(userId);
  if (BOT_CONFIG.ENABLE_CHAT_LOG)
    saveChatLog({ userId, segment:regSegment, userMessage:message, botReply, source, category, responseMs });
  updateDailyAnalytics(source, userId);
}


// ─── 4.4 Postback ────────────────────────────────────────────
function handlePostbackEvent(event, userId) {
  const replyToken = event.replyToken;
  const data       = event.postback && event.postback.data;
  if (!data) return;

  const params   = parsePostback(data);
  const roleInfo = resolveUserRole(userId);
  logInfo('Postback',`[${userId}] ACTION=${params.ACTION}`);

  // Permission guard สำหรับ Admin actions
  const adminActions = ['ADMIN_BROADCAST_LIST','ADMIN_POLISH','ADMIN_SEND',
                        'ADMIN_PUSH_LIST','ADMIN_PUSH_SEND','ADMIN_STATS','ADMIN_POLL_LIST','ADMIN_POLL_CLOSE'];
  if (adminActions.includes(params.ACTION) && !isAdminRole(roleInfo.role)) {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.ERROR_PERMISSION }]);
    return;
  }

  switch (params.ACTION) {

    // ─── Segment / Registration ──────────────────────────────
    case 'SELECT_SEGMENT':
      replyMessage(replyToken, [buildSegmentSelectFlex()]);
      break;

    case 'SET_SEGMENT':
      handleInitiateRegistration(replyToken, userId, params.SEG);
      break;

    // ─── Registration Confirm / Retry ────────────────────────
    case 'REG_SELECT_TEACHER':
      completeTeacherRegistration(replyToken, userId, params.TID);
      break;

    case 'REG_CONFIRM_STUDENT':
      completeStudentRegistration(replyToken, userId, params.SID);
      break;

    case 'REG_RETRY_STUDENT':
      saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_STUDENT_ID, retry:0 });
      replyMessage(replyToken, [{
        type:'text', text:MESSAGES.REG_ASK_STUDENT_ID,
        quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
      }]);
      break;

    case 'REG_CONFIRM_PARENT':
      completeParentRegistration(replyToken, userId, params.SID);
      break;

    case 'REG_RETRY_PARENT':
      saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_PARENT_STUDENT_ID, retry:0 });
      replyMessage(replyToken, [{
        type:'text', text:MESSAGES.REG_ASK_PARENT_ID,
        quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
      }]);
      break;

    // ─── Voting ──────────────────────────────────────────────
    case 'VOTE_SUBMIT':
      handleVoteSubmit(replyToken, userId, params.POLL, params.OPT, roleInfo.segment);
      break;

    case 'VOTE_VIEW':
      handleVoteView(replyToken, params.POLL);
      break;

    // ─── Content ─────────────────────────────────────────────
    case 'VIEW_EVENTS':
      handleEventsRequest(replyToken, userId, roleInfo.segment);
      break;

    case 'VIEW_NEWS':
      handleNewsRequest(replyToken, userId);
      break;

    // ─── Admin ───────────────────────────────────────────────
    case 'ADMIN_BROADCAST_LIST':
      handleAdminBroadcastList(replyToken, userId); break;
    case 'ADMIN_POLISH':
      handleAdminPolish(replyToken, userId, params.BC); break;
    case 'ADMIN_SEND':
      handleAdminSend(replyToken, userId, params.BC); break;
    case 'ADMIN_PUSH_LIST':
      handleAdminPushList(replyToken, userId); break;
    case 'ADMIN_PUSH_SEND':
      handleAdminPushSend(replyToken, userId, params.PUSH); break;
    case 'ADMIN_STATS':
      handleAdminStats(replyToken); break;
    case 'ADMIN_POLL_LIST':
      handleAdminPollList(replyToken); break;
    case 'ADMIN_POLL_CLOSE':
      handleAdminPollClose(replyToken, userId, params.POLL); break;

    default:
      logInfo('Postback',`Unknown ACTION: ${params.ACTION}`);
  }
}


// ─── 4.5 Admin Text ──────────────────────────────────────────
function handleAdminTextMessage(replyToken, userId) {
  const pending = _getPendingCounts();
  replyMessage(replyToken, [
    { type:'text', text:MESSAGES.ADMIN_WELCOME },
    buildAdminPanelFlex(pending.broadcasts, pending.pushes, pending.polls),
  ]);
}


// ============================================================
// SECTION 5: ADMIN COMMAND HANDLERS
// ============================================================

function handleAdminBroadcastList(replyToken, userId) {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
    const data    = sheet.getDataRange().getValues();
    const cols    = _headerMap(data[0], ['broadcastId','draft','polished','status','targetSegment']);
    const pending = data.slice(1).filter(r => {
      const s = r[cols.status];
      return s === SYSTEM_CONFIG.BROADCAST.STATUS.DRAFT ||
             s === SYSTEM_CONFIG.BROADCAST.STATUS.POLISHED ||
             s === SYSTEM_CONFIG.BROADCAST.STATUS.CONFIRMED;
    });
    if (pending.length === 0) { replyMessage(replyToken, [{type:'text',text:MESSAGES.ADMIN_BROADCAST_EMPTY}]); return; }
    const bubbles   = pending.slice(0,10).map(r => buildBroadcastItemFlex(r[cols.broadcastId], r[cols.draft]||r[cols.polished]||'(ว่าง)', r[cols.status], r[cols.targetSegment]));
    const carousel  = { type:'flex', altText:'📢 Broadcast List', contents:{ type:'carousel', contents:bubbles } };
    replyMessage(replyToken, [
      { type:'text', text:`📢 Broadcast รอดำเนินการ ${pending.length} รายการค่ะ` },
      carousel,
    ]);
  } catch(e) { logInfo('AdminBCList','❌',e.message); replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleAdminPolish(replyToken, userId, bcId) {
  if (!bcId) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }
  replyMessage(replyToken, [{ type:'text', text:`✨ กำลัง Polish ${bcId} อยู่นะคะ ⏳` }]);
  const result = polishBroadcastDraft(bcId);
  if (!result.success) { pushMessage(userId,[{type:'text',text:`❌ Polish ไม่สำเร็จค่ะ\n${result.error}`}]); return; }
  const preview = result.polished.length > 300 ? result.polished.substring(0,300) + '...' : result.polished;
  pushMessage(userId, [{
    type:'flex', altText:`✅ Polish ${bcId} เรียบร้อย`,
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1B5E20', paddingAll:'12px',
        contents:[{ type:'text', text:`✅ Polish ${bcId} เรียบร้อยแล้วค่ะ`, color:'#FFFFFF', weight:'bold', size:'sm' }]
      },
      body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
        contents:[
          { type:'text', text:'📝 ข้อความที่ปรับแล้ว:', size:'xs', color:'#888888' },
          { type:'separator', margin:'sm' },
          { type:'text', text:preview, size:'sm', wrap:true, color:'#333333', margin:'sm' },
          { type:'text', text:'📌 ตรวจสอบใน Sheets แล้วเปลี่ยน status เป็น CONFIRMED ก่อนส่งนะคะ', size:'xs', wrap:true, color:'#888888', margin:'md' },
        ]
      },
      footer:{ type:'box', layout:'vertical', paddingAll:'8px',
        contents:[{ type:'button', style:'primary', color:'#27AE60', height:'sm', margin:'sm',
          action:{ type:'postback', label:'📤 ส่งเลย (ต้อง CONFIRMED)', data:`ACTION=ADMIN_SEND|BC=${bcId}`, displayText:`ส่ง ${bcId}` } }]
      }
    }
  }]);
}

function handleAdminSend(replyToken, userId, bcId) {
  if (!bcId) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }
  replyMessage(replyToken, [{ type:'text', text:`📤 กำลังส่ง Broadcast ${bcId} นะคะ ⏳` }]);
  const result = sendBroadcast(bcId);
  if (!result.success) {
    pushMessage(userId,[{type:'text',text:`❌ ส่งไม่สำเร็จค่ะ\n${result.error}\n\nกรุณาตรวจสอบ status ใน Sheets นะคะ 🙏`}]);
    return;
  }
  pushMessage(userId,[{type:'text',text:MESSAGES.ADMIN_BROADCAST_SENT(bcId, result.count)}]);
}

function handleAdminPushList(replyToken, userId) {
  try {
    const sheet = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.PUSH_NOTIF);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['pushId','message','targetSegment','status']);
    const pend  = data.slice(1).filter(r => r[cols.status] === SYSTEM_CONFIG.BROADCAST.PUSH_STATUS.PENDING);
    if (pend.length === 0) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_PUSH_EMPTY}]); return; }
    const bubbles  = pend.slice(0,10).map(r => buildPushItemFlex(r[cols.pushId],r[cols.message],r[cols.targetSegment]));
    const carousel = { type:'flex', altText:'📣 Push List', contents:{ type:'carousel', contents:bubbles } };
    replyMessage(replyToken, [{ type:'text', text:`📣 Push รอส่ง ${pend.length} รายการค่ะ` }, carousel]);
  } catch(e) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleAdminPushSend(replyToken, userId, pushId) {
  if (!pushId) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }
  replyMessage(replyToken, [{ type:'text', text:`📣 กำลังส่ง Push ${pushId} นะคะ ⏳` }]);
  const result = sendPushNotification(pushId);
  if (!result.success) { pushMessage(userId,[{type:'text',text:`❌ ส่งไม่สำเร็จค่ะ\n${result.error}`}]); return; }
  pushMessage(userId,[{type:'text',text:MESSAGES.ADMIN_PUSH_SENT(pushId,result.count)}]);
}

function handleAdminStats(replyToken) {
  try {
    const stats = _getRecentAnalytics(7);
    let text = `📊 สถิติ 7 วันล่าสุด\n━━━━━━━━━━━━━━━━━━\n`;
    if (stats.length === 0) { text += 'ยังไม่มีข้อมูลค่ะ'; }
    else {
      let total=0, kw=0, llm=0, falls=0, newU=0;
      stats.forEach(r => { total+=r.totalMessages; kw+=r.keywordHits; llm+=(r.llmTargeted+r.llmFull); falls+=r.fallbacks; newU+=r.newUsers; });
      text += `📨 ข้อความทั้งหมด : ${total} ครั้ง\n`;
      text += `🔍 Keyword Match  : ${kw} (${total?Math.round(kw/total*100):0}%)\n`;
      text += `🤖 LLM API        : ${llm} (${total?Math.round(llm/total*100):0}%)\n`;
      text += `❓ ตอบไม่ได้       : ${falls} ครั้ง\n`;
      text += `👤 ผู้ใช้ใหม่       : ${newU} คน\n`;
      text += `━━━━━━━━━━━━━━━━━━\n${stats[0].date} — ${stats[stats.length-1].date}`;
    }
    replyMessage(replyToken, [{ type:'text', text }]);
  } catch(e) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleAdminPollList(replyToken) {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['pollId','title','description','option1','option2','option3','option4','targetSegment','endDate','status','resultVisible']);
    const polls = data.slice(1).filter(r => r[cols.pollId]);
    if (polls.length === 0) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_POLL_EMPTY}]); return; }

    const bubbles = polls.slice(0,10).map(r => {
      const pollId   = String(r[cols.pollId]);
      const isActive = r[cols.status] === SYSTEM_CONFIG.POLL_STATUS.ACTIVE;
      const results  = _getPollResults(pollId);
      const bubble   = {
        type:'bubble', size:'kilo',
        body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'12px',
          contents:[
            { type:'box', layout:'horizontal', contents:[
              { type:'text', text:pollId, weight:'bold', size:'sm', flex:3 },
              { type:'text', text:isActive ? '🟢 เปิด' : '🔴 ปิด', size:'xs', flex:2, align:'end',
                color:isActive ? '#27AE60' : '#E74C3C' },
            ]},
            { type:'text', text:r[cols.title], size:'sm', wrap:true, color:'#333333' },
            { type:'text', text:`🎯 ${r[cols.targetSegment]} | โหวต: ${results.total} คน`, size:'xs', color:'#888888' },
          ]
        }
      };
      if (isActive) {
        bubble.footer = { type:'box', layout:'vertical', paddingAll:'8px',
          contents:[{ type:'button', style:'secondary', color:'#E74C3C', height:'sm',
            action:{ type:'postback', label:'🔴 ปิด Poll', data:`ACTION=ADMIN_POLL_CLOSE|POLL=${pollId}`, displayText:`ปิด ${pollId}` } }]
        };
      }
      return bubble;
    });
    const carousel = { type:'flex', altText:'🗳️ Poll List', contents:{ type:'carousel', contents:bubbles } };
    replyMessage(replyToken, [{ type:'text', text:`🗳️ Poll ทั้งหมด ${polls.length} รายการค่ะ` }, carousel]);
  } catch(e) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleAdminPollClose(replyToken, userId, pollId) {
  if (!pollId) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }
  const result = closePoll(pollId);
  if (!result.success) { replyMessage(replyToken,[{type:'text',text:`❌ ปิด Poll ไม่สำเร็จ: ${result.error}`}]); return; }
  replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_POLL_CLOSED(pollId, result.total)}]);
}


// ============================================================
// SECTION 6: REGISTRATION FLOW
// ============================================================

/**
 * handleInitiateRegistration()
 * เรียกเมื่อผู้ใช้กดเลือก Segment ใน Flex Card
 * → เริ่ม State Machine ตาม segment ที่เลือก
 */
function handleInitiateRegistration(replyToken, userId, segment) {

  // ตรวจว่าลงทะเบียนไปแล้วหรือยัง
  const existing = getUserProfile(userId);
  if (existing && isRegistered(existing.segment)) {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.REG_ALREADY_REGISTERED }]);
    return;
  }

  if (segment === 'teacher') {
    saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_TEACHER_NAME, retry:0 });
    replyMessage(replyToken, [{
      type:'text',
      text:`ป้าไพรยินดีต้อนรับค่ะ 👩‍🏫\n\n${MESSAGES.REG_ASK_TEACHER_NAME}`,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
  } else if (segment === 'student') {
    saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_STUDENT_ID, retry:0 });
    replyMessage(replyToken, [{
      type:'text',
      text:`ป้าไพรยินดีต้อนรับนักเรียนค่ะ 🎓\n\n${MESSAGES.REG_ASK_STUDENT_ID}`,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
  } else if (segment === 'parent') {
    saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_PARENT_STUDENT_ID, retry:0 });
    replyMessage(replyToken, [{
      type:'text',
      text:`ป้าไพรยินดีต้อนรับผู้ปกครองค่ะ 👪\n\n${MESSAGES.REG_ASK_PARENT_ID}`,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
  } else {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.ERROR_GENERAL }]);
  }
}

/**
 * handleRegistrationInput()
 * Router สำหรับ text ที่รับระหว่าง Registration Flow
 */
function handleRegistrationInput(replyToken, userId, message, regState) {
  switch (regState.state) {
    case SYSTEM_CONFIG.REG_STATE.AWAIT_TEACHER_NAME:
      handleTeacherNameInput(replyToken, userId, message, regState);
      break;
    case SYSTEM_CONFIG.REG_STATE.AWAIT_STUDENT_ID:
      handleStudentIdInput(replyToken, userId, message, regState, false);
      break;
    case SYSTEM_CONFIG.REG_STATE.AWAIT_PARENT_STUDENT_ID:
      handleStudentIdInput(replyToken, userId, message, regState, true);
      break;
    default:
      clearRegState(userId);
      replyMessage(replyToken, [{ type:'text', text:MESSAGES.CANCELLED }]);
  }
}

// ─── 6.1 Teacher Name Input ───────────────────────────────────

function handleTeacherNameInput(replyToken, userId, name, regState) {
  const nameLower = name.trim().toLowerCase();
  if (!nameLower || nameLower.length < 2) {
    replyMessage(replyToken, [{ type:'text', text:`กรุณาพิมพ์ชื่อจริงอย่างน้อย 2 ตัวอักษรนะคะ\n\n${MESSAGES.REG_ASK_TEACHER_NAME}` }]);
    return;
  }

  const matches = _findTeachersByFirstName(name.trim());

  if (matches.length === 0) {
    const retry = (regState.retry || 0) + 1;
    if (retry >= SYSTEM_CONFIG.REG_MAX_RETRY) {
      clearRegState(userId);
      replyMessage(replyToken, [{ type:'text', text:MESSAGES.REG_CONTACT_ADMIN }]);
      return;
    }
    saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_TEACHER_NAME, retry });
    replyMessage(replyToken, [{
      type:'text',
      text:`${MESSAGES.REG_NOT_FOUND_TEACHER}\n\n(ลองได้อีก ${SYSTEM_CONFIG.REG_MAX_RETRY - retry} ครั้งค่ะ)`,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
    return;
  }

  // อัปเดต state รอ confirm
  saveRegState(userId, { state:SYSTEM_CONFIG.REG_STATE.AWAIT_TEACHER_CONFIRM, retry:0, matches:matches.map(m => m.teacherId) });

  if (matches.length === 1) {
    // พบแค่คนเดียว — แสดง Flex confirm
    replyMessage(replyToken, [
      { type:'text', text:`ป้าไพรพบข้อมูลค่ะ กรุณายืนยันนะคะ 😊` },
      buildTeacherSelectFlex(matches),
    ]);
  } else {
    // พบหลายคน — แสดง Carousel เลือก
    replyMessage(replyToken, [
      { type:'text', text:`ป้าไพรพบชื่อนี้ ${matches.length} ท่านค่ะ\nกรุณาเลือกชื่อที่ถูกต้องนะคะ 😊` },
      buildTeacherSelectFlex(matches),
    ]);
  }
}

/**
 * completeTeacherRegistration()
 * เรียกเมื่อ Admin กด "ใช่ ฉันคือท่านนี้" จาก Flex Card
 */
function completeTeacherRegistration(replyToken, userId, teacherId) {
  clearRegState(userId);

  const teacher = _getTeacherById(teacherId);
  if (!teacher) {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.ADMIN_NOT_FOUND }]);
    return;
  }

  // ตรวจซ้ำ — ถ้ามี userId แล้วใน Teacher_Registry
  if (teacher.userId && teacher.userId !== userId) {
    replyMessage(replyToken, [{ type:'text', text:`ขออภัยค่ะ ท่านนี้มีการลงทะเบียนแล้วค่ะ 🙏\nถ้าท่านคิดว่ามีข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบนะคะ` }]);
    return;
  }

  // บันทึก userId ลง Teacher_Registry
  _writeTeacherUserId(teacherId, userId);

  const segment = teacher.position === 'staff' ? 'staff' : 'teacher';

  // อัปเดต / สร้าง User_Profiles
  _upsertUserProfile(userId, teacher.fullName, segment, getProps().RICH_MENU_MEMBER || '');

  // สลับ Rich Menu
  switchRichMenu(userId, getProps().RICH_MENU_MEMBER);
  clearUserRoleCache(userId);

  const welcomeMsg = teacher.position === 'staff'
    ? MESSAGES.WELCOME_STAFF(teacher.firstName)
    : MESSAGES.WELCOME_TEACHER(teacher.firstName);

  replyMessage(replyToken, [
    { type:'text', text:MESSAGES.REG_SUCCESS_TEACHER(teacher.fullName, teacher.position) },
    { type:'text', text:welcomeMsg, quickReply:_mainQuickReply() },
  ]);
}

// ─── 6.2 Student / Parent ID Input ───────────────────────────

function handleStudentIdInput(replyToken, userId, idStr, regState, isParent) {
  const cleaned = idStr.trim().replace(/\s/g, '');

  // Validate 5 หลัก
  if (!/^\d{5}$/.test(cleaned)) {
    replyMessage(replyToken, [{
      type:'text',
      text:MESSAGES.REG_INVALID_STUDENT_ID,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
    return;
  }

  const student = _getStudentById(cleaned);

  if (!student) {
    const retry = (regState.retry || 0) + 1;
    if (retry >= SYSTEM_CONFIG.REG_MAX_RETRY) {
      clearRegState(userId);
      replyMessage(replyToken, [{ type:'text', text:isParent ? MESSAGES.REG_NOT_FOUND_PARENT : MESSAGES.REG_CONTACT_ADMIN }]);
      return;
    }
    const nextState = isParent ? SYSTEM_CONFIG.REG_STATE.AWAIT_PARENT_STUDENT_ID : SYSTEM_CONFIG.REG_STATE.AWAIT_STUDENT_ID;
    saveRegState(userId, { state:nextState, retry });
    const notFoundMsg = isParent ? MESSAGES.REG_NOT_FOUND_PARENT : MESSAGES.REG_NOT_FOUND_STUDENT;
    replyMessage(replyToken, [{
      type:'text',
      text:`${notFoundMsg}\n\n(ลองได้อีก ${SYSTEM_CONFIG.REG_MAX_RETRY - retry} ครั้งค่ะ)`,
      quickReply:{ items:[{ type:'action', action:{ type:'postback', label:'❌ ยกเลิก', data:'ACTION=SELECT_SEGMENT', displayText:'ยกเลิก' } }] }
    }]);
    return;
  }

  // พบนักเรียน — อัปเดต state รอ confirm
  const nextConfirmState = isParent ? SYSTEM_CONFIG.REG_STATE.AWAIT_PARENT_CONFIRM : SYSTEM_CONFIG.REG_STATE.AWAIT_STUDENT_CONFIRM;
  saveRegState(userId, { state:nextConfirmState, studentId:cleaned, retry:0 });

  if (isParent) {
    replyMessage(replyToken, [
      { type:'text', text:`ป้าไพรพบข้อมูลนักเรียนค่ะ\nกรุณายืนยันว่าเป็นบุตรหลานของท่านนะคะ 😊` },
      buildParentConfirmFlex(student),
    ]);
  } else {
    replyMessage(replyToken, [
      { type:'text', text:`ป้าไพรพบข้อมูลนักเรียนค่ะ\nกรุณายืนยันตัวตนนะคะ 😊` },
      buildStudentConfirmFlex(student),
    ]);
  }
}

function completeStudentRegistration(replyToken, userId, studentId) {
  clearRegState(userId);

  const student = _getStudentById(studentId);
  if (!student) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }

  if (student.userId && student.userId !== userId) {
    replyMessage(replyToken,[{type:'text',text:`ขออภัยค่ะ รหัสนักเรียนนี้มีการลงทะเบียนแล้วค่ะ 🙏\nถ้าท่านคิดว่ามีข้อผิดพลาด กรุณาติดต่อฝ่ายทะเบียนนะคะ`}]);
    return;
  }

  _writeStudentUserId(studentId, userId, null);
  _upsertUserProfile(userId, student.fullName, 'student', getProps().RICH_MENU_STUDENT || '');
  switchRichMenu(userId, getProps().RICH_MENU_STUDENT);
  clearUserRoleCache(userId);

  replyMessage(replyToken, [
    { type:'text', text:MESSAGES.REG_SUCCESS_STUDENT(student.fullName, student.class, student.room) },
    { type:'text', text:MESSAGES.WELCOME_STUDENT(student.firstName, student.class, student.room), quickReply:_mainQuickReply() },
  ]);
}

function completeParentRegistration(replyToken, userId, studentId) {
  clearRegState(userId);

  const student = _getStudentById(studentId);
  if (!student) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ADMIN_NOT_FOUND}]); return; }

  _writeStudentUserId(studentId, null, userId); // เขียน parentUserId
  _upsertUserProfile(userId, '', 'parent', getProps().RICH_MENU_MEMBER || '');
  switchRichMenu(userId, getProps().RICH_MENU_MEMBER);
  clearUserRoleCache(userId);

  replyMessage(replyToken, [
    { type:'text', text:MESSAGES.REG_SUCCESS_PARENT(student.fullName, student.class, student.room) },
    { type:'text', text:MESSAGES.WELCOME_PARENT(student.fullName), quickReply:_mainQuickReply() },
  ]);
}

// ─── Registry Sheet Helpers ───────────────────────────────────

function _findTeachersByFirstName(firstName) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['teacherId','firstName','lastName','fullName','department','position','userId','status']);
    return data.slice(1).filter(r =>
      r[cols.status] === 'active' &&
      String(r[cols.firstName]).trim().toLowerCase().includes(firstName.toLowerCase())
    ).map(r => ({
      teacherId:  String(r[cols.teacherId]),
      firstName:  String(r[cols.firstName]),
      lastName:   String(r[cols.lastName]),
      fullName:   String(r[cols.fullName]),
      department: String(r[cols.department]),
      position:   String(r[cols.position]),
      userId:     String(r[cols.userId] || ''),
    }));
  } catch(e) { logInfo('_findTeachers','❌',e.message); return []; }
}

function _findTeacherByUserId(userId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['teacherId','firstName','lastName','fullName','department','position','userId','status']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.userId]) === String(userId) && data[i][cols.status] === 'active')
        return { teacherId:String(data[i][cols.teacherId]), firstName:String(data[i][cols.firstName]),
                 fullName:String(data[i][cols.fullName]), department:String(data[i][cols.department]),
                 position:String(data[i][cols.position]) };
    }
    return null;
  } catch(e) { return null; }
}

function _getTeacherById(teacherId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['teacherId','firstName','lastName','fullName','department','position','userId','status']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.teacherId]) === String(teacherId))
        return { teacherId:String(data[i][cols.teacherId]), firstName:String(data[i][cols.firstName]),
                 lastName:String(data[i][cols.lastName]), fullName:String(data[i][cols.fullName]),
                 department:String(data[i][cols.department]), position:String(data[i][cols.position]),
                 userId:String(data[i][cols.userId]||''), status:String(data[i][cols.status]) };
    }
    return null;
  } catch(e) { return null; }
}

function _writeTeacherUserId(teacherId, userId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['teacherId','userId','registeredAt']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.teacherId]) === String(teacherId)) {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          sheet.getRange(i+1, cols.userId+1).setValue(userId);
          sheet.getRange(i+1, cols.registeredAt+1).setValue(new Date());
        } finally { lock.releaseLock(); }
        return;
      }
    }
  } catch(e) { logInfo('_writeTeacherUserId','❌',e.message); }
}

function _getStudentById(studentId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.STUDENT_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['studentId','firstName','lastName','fullName','class','room','year','userId','parentUserId','status']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.studentId]) === String(studentId) && data[i][cols.status] === 'active')
        return { studentId:String(data[i][cols.studentId]), firstName:String(data[i][cols.firstName]),
                 lastName:String(data[i][cols.lastName]), fullName:String(data[i][cols.fullName]),
                 class:String(data[i][cols.class]), room:String(data[i][cols.room]),
                 year:String(data[i][cols.year]), userId:String(data[i][cols.userId]||''),
                 parentUserId:String(data[i][cols.parentUserId]||'') };
    }
    return null;
  } catch(e) { return null; }
}

function _findStudentByUserId(userId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.STUDENT_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['studentId','firstName','lastName','fullName','class','room','year','userId','status']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.userId]) === String(userId) && data[i][cols.status] === 'active')
        return { studentId:String(data[i][cols.studentId]), firstName:String(data[i][cols.firstName]),
                 fullName:String(data[i][cols.fullName]), class:String(data[i][cols.class]),
                 room:String(data[i][cols.room]), year:String(data[i][cols.year]) };
    }
    return null;
  } catch(e) { return null; }
}

function _writeStudentUserId(studentId, studentUserId, parentUserId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.STUDENT_REGISTRY);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['studentId','userId','parentUserId','registeredAt']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.studentId]) === String(studentId)) {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          if (studentUserId) sheet.getRange(i+1, cols.userId+1).setValue(studentUserId);
          if (parentUserId)  sheet.getRange(i+1, cols.parentUserId+1).setValue(parentUserId);
          if (!data[i][cols.registeredAt] || data[i][cols.registeredAt] === '') {
            sheet.getRange(i+1, cols.registeredAt+1).setValue(new Date());
          }
        } finally { lock.releaseLock(); }
        return;
      }
    }
  } catch(e) { logInfo('_writeStudentUserId','❌',e.message); }
}


// ============================================================
// SECTION 7: FAQ PIPELINE
// ============================================================

function layer1_keywordMatch(message) {
  const msgLower = message.toLowerCase().trim();
  const faqs     = _loadAllFaqRaw();
  for (const faq of faqs) {
    if (!faq.active || !faq.keywords) continue;
    const kws = String(faq.keywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    for (const kw of kws) {
      if (kw && msgLower.includes(kw))
        return { faqId:faq.faqId, category:faq.category, answer:faq.answer };
    }
  }
  return null;
}

function layer2_categoryMatch(message) {
  const msgLower = message.toLowerCase().trim();
  const cats     = _loadCategoriesRaw();
  for (const cat of cats) {
    if (!cat.active) continue;
    const kws = String(cat.categoryKeywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    for (const kw of kws) {
      if (kw && msgLower.includes(kw))
        return { category:cat.category, promptHint:cat.promptHint };
    }
  }
  return null;
}

function buildFaqContext(categoryFilter) {
  const cache    = CacheService.getScriptCache();
  const cacheKey = categoryFilter
    ? SYSTEM_CONFIG.CACHE.FAQ_KB_CAT_PREFIX + categoryFilter
    : SYSTEM_CONFIG.CACHE.FAQ_KB_ALL;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const faqs    = _loadAllFaqRaw();
  const filtered = faqs.filter(f => f.active && (!categoryFilter || String(f.category).trim() === String(categoryFilter).trim()));
  const context  = filtered.map(f => `หมวด: ${f.category}\nQ: ${f.question}\nA: ${f.answer}`).join('\n\n');
  cache.put(cacheKey, context, SYSTEM_CONFIG.CACHE.FAQ_TTL);
  return context;
}

/**
 * buildFaqSystemPrompt()
 * เพิ่ม userContext เพื่อให้ป้าไพรเรียกชื่อผู้ใช้ตาม segment
 */
function buildFaqSystemPrompt(faqContext, language, segment, promptHint, userContext) {
  const roleTitle = SYSTEM_CONFIG.ROLE_TITLE[segment] || 'คุณ';

  const userCtxBlock = userContext
    ? `\n\nข้อมูลผู้ใช้:\n${userContext}\nให้เรียกผู้ใช้ว่า "${roleTitle}" ตลอดการสนทนาค่ะ`
    : `\nให้เรียกผู้ใช้ว่า "${roleTitle}" ค่ะ`;

  const baseTH =
`คุณคือ "ป้าไพร" (PAPRAI) ผู้ช่วยข้อมูลอัจฉริยะของโรงเรียนสาธิต มหาวิทยาลัยศิลปากร (มัธยมศึกษา)

กฎการตอบ:
1. ตอบเฉพาะข้อมูลที่มีในเอกสารด้านล่างเท่านั้น สังเคราะห์คำตอบจากเอกสารได้
2. ถ้าไม่พบข้อมูล ให้ตอบว่า "ไม่พบข้อมูล" ห้ามเดาหรือแต่งเติม
3. เรียกตัวเองว่า "ป้าไพร" เสมอ ห้ามใช้ "ฉัน" หรือ "ผม"
4. ลงท้ายด้วย ค่ะ หรือ นะคะ ตามความเหมาะสม
5. ห้ามใช้ Markdown (**, -, #) เพราะ LINE ไม่แสดงผล
6. ใช้ emoji 1-3 ตัว เช่น 📌 🎓 📞
7. ปิดท้ายด้วยการเชิญให้ถามต่อเสมอ
${promptHint ? `8. ${promptHint}` : ''}
${userCtxBlock}

━━━━━━━━━━━━━━━━━━
ข้อมูลอ้างอิง:
━━━━━━━━━━━━━━━━━━
${faqContext}
━━━━━━━━━━━━━━━━━━`;

  const baseEN =
`You are "PAPRAI", the smart information assistant of Demonstration School of Silpakorn University.

Rules:
1. Answer ONLY from the reference information below. Synthesize from documents.
2. If no info found, say "I don't have information on this" — never guess.
3. Always refer to yourself as "PAPRAI".
4. Do NOT use Markdown formatting.
5. Use 1-3 emoji where appropriate.
6. End every reply by inviting further questions.
${promptHint ? `7. ${promptHint}` : ''}
${userContext ? `\nUser context:\n${userContext}` : ''}

━━━━━━━━━━━━━━━━━━
Reference Information:
━━━━━━━━━━━━━━━━━━
${faqContext}
━━━━━━━━━━━━━━━━━━`;

  return language === 'en' ? baseEN : baseTH;
}

function _buildUserContext(profile, segment) {
  if (!profile || segment === SYSTEM_CONFIG.ROLE.VISITOR) return null;
  const lines = [];
  if (profile.displayName) lines.push(`ชื่อ: ${profile.displayName}`);
  lines.push(`ประเภทผู้ใช้: ${SYSTEM_CONFIG.ROLE_TITLE[segment] || segment}`);
  return lines.join('\n');
}

function _loadAllFaqRaw() {
  const cache  = CacheService.getScriptCache();
  const cached = cache.get(SYSTEM_CONFIG.CACHE.FAQ_RAW);
  if (cached) return JSON.parse(cached);
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.FAQ_MASTER);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['faqId','category','question','answer','keywords','active']);
    const faqs  = data.slice(1).filter(r => r[cols.faqId]).map(r => ({
      faqId:String(r[cols.faqId]), category:String(r[cols.category]),
      question:String(r[cols.question]), answer:String(r[cols.answer]),
      keywords:String(r[cols.keywords]), active:String(r[cols.active]).toUpperCase() === 'TRUE',
    }));
    cache.put(SYSTEM_CONFIG.CACHE.FAQ_RAW, JSON.stringify(faqs), SYSTEM_CONFIG.CACHE.FAQ_TTL);
    return faqs;
  } catch(e) { logInfo('_loadAllFaqRaw','❌',e.message); return []; }
}

function _loadCategoriesRaw() {
  const cache  = CacheService.getScriptCache();
  const cached = cache.get(SYSTEM_CONFIG.CACHE.CATEGORIES_RAW);
  if (cached) return JSON.parse(cached);
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.FAQ_CATEGORIES);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['category','categoryKeywords','displayName','promptHint','active']);
    const cats  = data.slice(1).filter(r => r[cols.category]).map(r => ({
      category:String(r[cols.category]), categoryKeywords:String(r[cols.categoryKeywords]),
      displayName:String(r[cols.displayName]), promptHint:String(r[cols.promptHint]||''),
      active:String(r[cols.active]).toUpperCase() === 'TRUE',
    }));
    cache.put(SYSTEM_CONFIG.CACHE.CATEGORIES_RAW, JSON.stringify(cats), SYSTEM_CONFIG.CACHE.FAQ_TTL);
    return cats;
  } catch(e) { logInfo('_loadCategoriesRaw','❌',e.message); return []; }
}


// ============================================================
// SECTION 8: VOTING SYSTEM
// ============================================================

function handleVoteRequest(replyToken, userId, segment) {
  // Visitor ต้องลงทะเบียนก่อน
  if (!isRegistered(segment)) {
    replyMessage(replyToken, [
      { type:'text', text:MESSAGES.VOTE_NEED_REGISTER },
      buildSegmentSelectFlex(),
    ]);
    return;
  }

  try {
    const sheet  = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
    const data   = sheet.getDataRange().getValues();
    const cols   = _headerMap(data[0], ['pollId','title','description','option1','option2','option3','option4','targetSegment','startDate','endDate','status','resultVisible']);

    const today  = new Date();
    const active = data.slice(1).filter(r => {
      if (r[cols.status] !== SYSTEM_CONFIG.POLL_STATUS.ACTIVE) return false;
      const end = new Date(r[cols.endDate]);
      if (isNaN(end.getTime()) || end < today) return false;
      const target = String(r[cols.targetSegment]);
      return target === 'all' || target === segment;
    });

    if (active.length === 0) {
      replyMessage(replyToken, [{ type:'text', text:MESSAGES.VOTE_NO_ACTIVE_POLLS }]);
      return;
    }

    const bubbles = active.slice(0,10).map(r => {
      const pollId = String(r[cols.pollId]);
      const vote   = _getUserVote(pollId, userId);
      const poll   = {
        pollId, title:r[cols.title], description:r[cols.description],
        option1:r[cols.option1], option2:r[cols.option2], option3:r[cols.option3], option4:r[cols.option4],
        endDate:r[cols.endDate], resultVisible:String(r[cols.resultVisible]).toUpperCase() === 'TRUE',
      };
      return buildPollFlex(poll, !!vote, vote ? vote.selectedOption : null);
    });

    const msg = { type:'flex', altText:`🗳️ โหวต (${active.length} รายการ)`, contents:{ type:'carousel', contents:bubbles } };
    replyMessage(replyToken, [
      { type:'text', text:`🗳️ มีการโหวต ${active.length} รายการที่เปิดอยู่ค่ะ 😊` },
      msg,
    ]);

  } catch(e) { logInfo('handleVoteRequest','❌',e.message); replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleVoteSubmit(replyToken, userId, pollId, optionStr, segment) {
  if (!isRegistered(segment)) {
    replyMessage(replyToken, [{ type:'text', text:MESSAGES.VOTE_NEED_REGISTER }, buildSegmentSelectFlex()]);
    return;
  }

  try {
    // โหลด Poll
    const poll = _getPollById(pollId);
    if (!poll) { replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_CLOSED}]); return; }
    if (poll.status !== SYSTEM_CONFIG.POLL_STATUS.ACTIVE) { replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_CLOSED}]); return; }

    // ตรวจ targetSegment
    if (poll.targetSegment !== 'all' && poll.targetSegment !== segment) {
      replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_PERMISSION_DENIED}]); return;
    }

    // ตรวจโหวตซ้ำ
    const existing = _getUserVote(pollId, userId);
    if (existing) {
      const optLabel = poll[`option${existing.selectedOption}`] || `ตัวเลือก ${existing.selectedOption}`;
      replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_ALREADY_VOTED(optLabel)}]);
      return;
    }

    // บันทึกโหวต
    const optNum    = parseInt(optionStr, 10);
    const optLabel  = poll[`option${optNum}`] || `ตัวเลือก ${optNum}`;
    const voteId    = `VOTE_${pollId}_${userId.substring(1,6)}_${Date.now()}`.substring(0,30);

    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_VOTES).appendRow([
        voteId, pollId, userId, segment, optNum, new Date()
      ]);
    } finally { lock.releaseLock(); }

    // แสดงผล
    if (poll.resultVisible) {
      const results = _getPollResults(pollId);
      replyMessage(replyToken, [
        { type:'text', text:MESSAGES.VOTE_SUCCESS(optLabel) },
        buildPollResultFlex(poll, results),
      ]);
    } else {
      replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_SUCCESS(optLabel)}]);
    }

  } catch(e) { logInfo('handleVoteSubmit','❌',e.message); replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function handleVoteView(replyToken, pollId) {
  try {
    const poll = _getPollById(pollId);
    if (!poll) { replyMessage(replyToken,[{type:'text',text:MESSAGES.VOTE_CLOSED}]); return; }
    const results = _getPollResults(pollId);
    replyMessage(replyToken,[buildPollResultFlex(poll, results)]);
  } catch(e) { replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

function _getPollById(pollId) {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['pollId','title','description','option1','option2','option3','option4','targetSegment','endDate','status','resultVisible']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.pollId]) === String(pollId))
        return {
          pollId:String(data[i][cols.pollId]), title:String(data[i][cols.title]),
          description:String(data[i][cols.description]),
          option1:data[i][cols.option1], option2:data[i][cols.option2],
          option3:data[i][cols.option3], option4:data[i][cols.option4],
          targetSegment:String(data[i][cols.targetSegment]),
          endDate:data[i][cols.endDate], status:String(data[i][cols.status]),
          resultVisible:String(data[i][cols.resultVisible]).toUpperCase() === 'TRUE',
        };
    }
    return null;
  } catch(e) { return null; }
}

function _getUserVote(pollId, userId) {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_VOTES);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['pollId','userId','selectedOption']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.pollId]) === String(pollId) && String(data[i][cols.userId]) === String(userId))
        return { selectedOption:data[i][cols.selectedOption] };
    }
    return null;
  } catch(e) { return null; }
}


// ============================================================
// SECTION 9: NEWS FEED & EVENTS
// ============================================================

function handleNewsRequest(replyToken, userId) {
  try {
    // ตรวจ CacheService ก่อน
    const cache  = CacheService.getScriptCache();
    const cached = cache.get(SYSTEM_CONFIG.CACHE.NEWS_CACHE);
    if (cached) {
      const items = JSON.parse(cached);
      if (items.length > 0) { replyMessage(replyToken,[buildNewsFlex(items)]); return; }
    }

    // อ่านจาก Sheet (cached ล่าสุด)
    const sheetItems = _loadNewsFeedFromSheet();
    if (sheetItems.length > 0) {
      cache.put(SYSTEM_CONFIG.CACHE.NEWS_CACHE, JSON.stringify(sheetItems), SYSTEM_CONFIG.CACHE.NEWS_TTL);
      replyMessage(replyToken,[buildNewsFlex(sheetItems)]);
      return;
    }

    // ดึงจาก URL โรงเรียน
    replyMessage(replyToken,[{ type:'text', text:MESSAGES.NEWS_LOADING }]);
    const fetched = fetchSchoolNews();
    if (fetched.length === 0) { pushMessage(userId,[{type:'text',text:MESSAGES.NEWS_NOT_FOUND}]); return; }
    pushMessage(userId,[buildNewsFlex(fetched)]);

  } catch(e) { logInfo('handleNewsRequest','❌',e.message); replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}

/**
 * fetchSchoolNews()
 * ดึงข่าวจาก NEWS_SOURCE_URL → parse → บันทึก Sheet → Cache
 */
function fetchSchoolNews() {
  try {
    const sourceUrl = _getBotConfigValue('NEWS_SOURCE_URL', 'https://satit.su.ac.th');
    const fetchCount = parseInt(_getBotConfigValue('NEWS_FETCH_COUNT', '5'), 10);

    const res = UrlFetchApp.fetch(sourceUrl, { muteHttpExceptions:true, followRedirects:true });
    if (res.getResponseCode() !== 200) return [];

    const html = res.getContentText();

    // ดึง <title> tags (หัวข้อข่าวทั่วไป)
    const titleMatches = html.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
    // ดึง link+text จาก <a> tags ที่น่าจะเป็นข่าว
    const linkMatches  = html.match(/<a[^>]+href="([^"]*)"[^>]*>([^<]{10,80})<\/a>/gi) || [];

    if (linkMatches.length === 0 && titleMatches.length === 0) {
      // ถ้า parse ไม่ได้ → ใช้ LLM สรุป HTML
      return _summarizeNewsWithLLM(html.substring(0, 3000), sourceUrl, fetchCount);
    }

    const newsItems = [];
    const processedUrls = new Set();

    for (const match of linkMatches) {
      if (newsItems.length >= fetchCount) break;
      const hrefMatch = match.match(/href="([^"]*)"/);
      const textMatch = match.replace(/<[^>]+>/g, '').trim();
      if (!hrefMatch || !textMatch || textMatch.length < 10) continue;

      let href = hrefMatch[1];
      if (href.startsWith('/')) href = sourceUrl.replace(/\/$/, '') + href;
      if (!href.startsWith('http') || processedUrls.has(href)) continue;
      processedUrls.add(href);

      newsItems.push({
        newsId:       `NEWS_${Date.now()}_${newsItems.length}`,
        title:        textMatch.substring(0, 80),
        summary:      `คลิกอ่านข้อมูลเพิ่มเติมได้ที่ลิงก์ค่ะ`,
        sourceUrl:    href,
        publishedDate:Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
        fetchedAt:    new Date(),
        active:       'TRUE',
      });
    }

    if (newsItems.length > 0) _saveNewsFeedToSheet(newsItems);
    CacheService.getScriptCache().put(SYSTEM_CONFIG.CACHE.NEWS_CACHE, JSON.stringify(newsItems), SYSTEM_CONFIG.CACHE.NEWS_TTL);
    return newsItems;

  } catch(e) { logInfo('fetchSchoolNews','❌',e.message); return []; }
}

function _summarizeNewsWithLLM(htmlSnippet, sourceUrl, count) {
  try {
    const prompt = `ต่อไปนี้คือ HTML ของหน้าข่าวโรงเรียนสาธิต ม.ศิลปากร
สกัดหัวข้อข่าวล่าสุดจำนวน ${count} รายการออกมาในรูปแบบ JSON array:
[{"title":"...", "summary":"...", "publishedDate":"..."}]
ตอบเฉพาะ JSON ล้วนๆ ไม่มีคำอธิบาย ถ้าหาไม่ได้ให้ตอบ []
\n\nHTML:\n${htmlSnippet}`;

    const raw = _callLLM(getProps(), 'คุณเป็น HTML parser ที่แม่นยำ', prompt, BOT_CONFIG.AI_NEWS_MAX_TOKENS);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    return parsed.slice(0, count).map((n, i) => ({
      newsId:       `NEWS_LLM_${Date.now()}_${i}`,
      title:        n.title || 'ข่าวโรงเรียน',
      summary:      n.summary || '',
      sourceUrl:    sourceUrl,
      publishedDate:n.publishedDate || Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
      fetchedAt:    new Date(),
      active:       'TRUE',
    }));
  } catch(e) { logInfo('_summarizeNewsWithLLM','❌',e.message); return []; }
}

function _loadNewsFeedFromSheet() {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.NEWS_FEED_CACHE);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['newsId','title','summary','sourceUrl','publishedDate','fetchedAt','active']);
    const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000);
    return data.slice(1)
      .filter(r => r[cols.active] === 'TRUE' || r[cols.active] === true)
      .filter(r => r[cols.fetchedAt] && new Date(r[cols.fetchedAt]) > sixHoursAgo)
      .slice(0, 5)
      .map(r => ({
        newsId: String(r[cols.newsId]), title:String(r[cols.title]),
        summary:String(r[cols.summary]), sourceUrl:String(r[cols.sourceUrl]),
        publishedDate:String(r[cols.publishedDate]).substring(0,10),
      }));
  } catch(e) { return []; }
}

function _saveNewsFeedToSheet(newsItems) {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.NEWS_FEED_CACHE);
    // ล้างข้อมูลเก่า (เก็บแค่ header)
    if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
    const rows = newsItems.map(n => [n.newsId, n.title, n.summary, n.sourceUrl, n.publishedDate, n.fetchedAt, n.active]);
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    } finally { lock.releaseLock(); }
  } catch(e) { logInfo('_saveNewsFeedToSheet','❌',e.message); }
}

function handleEventsRequest(replyToken, userId, segment) {
  try {
    const sheet   = getContentSheet(SYSTEM_CONFIG.SHEETS.EVENT_CALENDAR);
    const data    = sheet.getDataRange().getValues();
    const cols    = _headerMap(data[0], ['eventId','eventDate','title','description','targetSegment']);
    const today   = new Date(); today.setHours(0,0,0,0);

    const upcoming = data.slice(1).filter(r => {
      if (!r[cols.eventId]) return false;
      const evDate  = new Date(r[cols.eventDate]);
      if (isNaN(evDate.getTime()) || evDate < today) return false;
      const target  = String(r[cols.targetSegment] || 'all');
      return target === 'all' || target === segment;
    }).sort((a, b) => new Date(a[cols.eventDate]) - new Date(b[cols.eventDate]));

    if (upcoming.length === 0) { replyMessage(replyToken,[{type:'text',text:MESSAGES.EVENTS_EMPTY}]); return; }

    const events = upcoming.slice(0,5).map(r => ({
      eventId:String(r[cols.eventId]), eventDate:r[cols.eventDate],
      title:String(r[cols.title]), description:String(r[cols.description]||''),
    }));

    replyMessage(replyToken,[
      { type:'text', text:`📅 กิจกรรมที่กำลังจะมา ${events.length} รายการค่ะ 😊` },
      buildEventsFlex(events),
    ]);

  } catch(e) { logInfo('handleEventsRequest','❌',e.message); replyMessage(replyToken,[{type:'text',text:MESSAGES.ERROR_GENERAL}]); }
}


// ============================================================
// SECTION 10: SEGMENT & RICH MENU
// ============================================================

function switchRichMenu(userId, richMenuId) {
  if (!richMenuId) return;
  try {
    const token = getProps().LINE_TOKEN;
    UrlFetchApp.fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
      method:'post', headers:{'Authorization':`Bearer ${token}`}, muteHttpExceptions:true,
    });
    logInfo('RichMenu',`Linked → ${userId}`);
  } catch(e) { logInfo('switchRichMenu','❌',e.message); }
}


// ============================================================
// SECTION 11: LINE API LAYER
// ============================================================

function replyMessage(replyToken, messages) {
  if (!replyToken) return;
  if (!Array.isArray(messages)) messages = [messages];
  const formatted = messages.map(m => typeof m === 'string' ? { type:'text', text:m } : m);
  try {
    const token = getProps().LINE_TOKEN;
    const res   = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
      method:'post', contentType:'application/json',
      headers:{'Authorization':`Bearer ${token}`},
      payload:JSON.stringify({ replyToken, messages:formatted.slice(0,5) }),
      muteHttpExceptions:true,
    });
    if (res.getResponseCode() !== 200)
      logInfo('replyMessage',`Error (${res.getResponseCode()})`,res.getContentText().substring(0,200));
  } catch(e) { logInfo('replyMessage','❌',e.message); }
}

function pushMessage(userId, messages) {
  if (!userId) return;
  if (!Array.isArray(messages)) messages = [messages];
  const formatted = messages.map(m => typeof m === 'string' ? { type:'text', text:m } : m);
  try {
    const token   = getProps().LINE_TOKEN;
    const batches = [];
    for (let i = 0; i < formatted.length; i += 5) batches.push(formatted.slice(i, i+5));
    for (const batch of batches) {
      const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
        method:'post', contentType:'application/json',
        headers:{'Authorization':`Bearer ${token}`},
        payload:JSON.stringify({ to:userId, messages:batch }),
        muteHttpExceptions:true,
      });
      if (res.getResponseCode() !== 200)
        logInfo('pushMessage',`Error (${res.getResponseCode()})`,res.getContentText().substring(0,200));
      if (batches.length > 1) Utilities.sleep(200);
    }
  } catch(e) { logInfo('pushMessage','❌',e.message); }
}

function getLineProfile(userId) {
  try {
    const token = getProps().LINE_TOKEN;
    const res   = UrlFetchApp.fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers:{'Authorization':`Bearer ${token}`}, muteHttpExceptions:true,
    });
    if (res.getResponseCode() !== 200) return null;
    return JSON.parse(res.getContentText());
  } catch(e) { return null; }
}

function parsePostback(data) {
  const pairs = {};
  String(data).split('|').forEach(part => {
    const eqIdx = part.indexOf('=');
    if (eqIdx > -1) pairs[part.substring(0,eqIdx).trim()] = part.substring(eqIdx+1).trim();
  });
  return pairs;
}


// ============================================================
// SECTION 12: SHEETS LAYER
// ============================================================

function saveUserProfile(data) {
  try {
    const sheet   = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const allData = sheet.getDataRange().getValues();
    const cols    = _headerMap(allData[0], ['userId','lastActive']);
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][cols.userId] === data.userId) {
        const lock = LockService.getScriptLock();
        try { lock.waitLock(10000); sheet.getRange(i+1, cols.lastActive+1).setValue(new Date()); }
        finally { lock.releaseLock(); }
        return;
      }
    }
    const row = [data.userId, data.displayName||'', data.segment||'visitor', data.richMenuId||'',
                 data.language||'th', data.joinDate||new Date(), data.lastActive||new Date(), data.status||'active'];
    const lock = LockService.getScriptLock();
    try { lock.waitLock(10000); sheet.appendRow(row); }
    finally { lock.releaseLock(); }
    logInfo('saveUserProfile','New user', data.userId);
  } catch(e) { logInfo('saveUserProfile','❌',e.message); }
}

function _upsertUserProfile(userId, displayName, segment, richMenuId) {
  try {
    const sheet   = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const allData = sheet.getDataRange().getValues();
    const cols    = _headerMap(allData[0], ['userId','displayName','segment','richMenuId','lastActive']);
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][cols.userId] === userId) {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          if (displayName) sheet.getRange(i+1, cols.displayName+1).setValue(displayName);
          sheet.getRange(i+1, cols.segment+1).setValue(segment);
          if (richMenuId) sheet.getRange(i+1, cols.richMenuId+1).setValue(richMenuId);
          sheet.getRange(i+1, cols.lastActive+1).setValue(new Date());
        } finally { lock.releaseLock(); }
        clearUserRoleCache(userId);
        return;
      }
    }
    // ไม่พบ → สร้างใหม่
    saveUserProfile({ userId, displayName, segment, richMenuId, language:'th', joinDate:new Date(), lastActive:new Date(), status:'active' });
    clearUserRoleCache(userId);
  } catch(e) { logInfo('_upsertUserProfile','❌',e.message); }
}

function _ensureUserProfile(userId, displayName, segment) {
  const existing = getUserProfile(userId);
  if (!existing) {
    const menuKey  = SYSTEM_CONFIG.SEGMENT_MENU_KEY[segment] || 'RICH_MENU_VISITOR';
    const menuId   = getProps()[menuKey] || '';
    saveUserProfile({ userId, displayName, segment, richMenuId:menuId, language:'th', joinDate:new Date(), lastActive:new Date(), status:'active' });
  } else {
    _updateLastActive(userId);
  }
}

function getUserProfile(userId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const data  = sheet.getDataRange().getValues();
    const h     = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        const row = {};
        h.forEach((col, idx) => { row[col] = data[i][idx]; });
        return row;
      }
    }
    return null;
  } catch(e) { return null; }
}

function _updateLastActive(userId) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['userId','lastActive']);
    for (let i = 1; i < data.length; i++) {
      if (data[i][cols.userId] === userId) {
        const lock = LockService.getScriptLock();
        try { lock.waitLock(5000); sheet.getRange(i+1, cols.lastActive+1).setValue(new Date()); }
        finally { lock.releaseLock(); }
        return;
      }
    }
  } catch(e) { /* non-critical */ }
}

function saveChatLog(data) {
  try {
    const row = [new Date(), data.userId||'', data.segment||'', data.userMessage||'',
                 data.botReply||'', data.source||'', data.category||'', data.responseMs||0];
    const lock = LockService.getScriptLock();
    try { lock.waitLock(10000); getMainSheet(SYSTEM_CONFIG.SHEETS.CHAT_LOGS).appendRow(row); }
    finally { lock.releaseLock(); }
  } catch(e) { logInfo('saveChatLog','❌',e.message); }
}

function updateDailyAnalytics(source, userId) {
  try {
    const today   = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
    const sheet   = getMainSheet(SYSTEM_CONFIG.SHEETS.ANALYTICS);
    const data    = sheet.getDataRange().getValues();
    const cols    = _headerMap(data[0], ['date','totalMessages','keywordHits','llmTargeted','llmFull','fallbacks','newUsers','activeUsers']);
    let rowIdx    = -1;
    for (let i = 1; i < data.length; i++) {
      try {
        const d = Utilities.formatDate(new Date(data[i][cols.date]), 'Asia/Bangkok', 'yyyy-MM-dd');
        if (d === today) { rowIdx = i + 1; break; }
      } catch(e) {}
    }
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      if (rowIdx === -1) {
        const row = Array(data[0].length).fill(0);
        row[cols.date]          = today;
        row[cols.totalMessages] = 1;
        row[cols.keywordHits]   = source === 'keyword'      ? 1 : 0;
        row[cols.llmTargeted]   = source === 'llm_targeted' ? 1 : 0;
        row[cols.llmFull]       = source === 'llm_full'     ? 1 : 0;
        row[cols.fallbacks]     = source === 'fallback'     ? 1 : 0;
        row[cols.newUsers]      = 1; row[cols.activeUsers]  = 1;
        sheet.appendRow(row);
      } else {
        const get = col => parseInt(sheet.getRange(rowIdx, col+1).getValue()||0);
        const set = (col, val) => sheet.getRange(rowIdx, col+1).setValue(val);
        set(cols.totalMessages, get(cols.totalMessages) + 1);
        const colMap = { keyword:cols.keywordHits, llm_targeted:cols.llmTargeted, llm_full:cols.llmFull, fallback:cols.fallbacks };
        if (colMap[source] !== undefined) set(colMap[source], get(colMap[source]) + 1);
      }
    } finally { lock.releaseLock(); }
  } catch(e) { logInfo('updateDailyAnalytics','warn',e.message); }
}

function _getRecentAnalytics(days) {
  try {
    const sheet = getMainSheet(SYSTEM_CONFIG.SHEETS.ANALYTICS);
    const data  = sheet.getDataRange().getValues();
    const cols  = _headerMap(data[0], ['date','totalMessages','keywordHits','llmTargeted','llmFull','fallbacks','newUsers','activeUsers']);
    return data.slice(1).filter(r => r[cols.date]).slice(-days).map(r => ({
      date:String(r[cols.date]).substring(0,10),
      totalMessages:parseInt(r[cols.totalMessages])||0, keywordHits:parseInt(r[cols.keywordHits])||0,
      llmTargeted:parseInt(r[cols.llmTargeted])||0, llmFull:parseInt(r[cols.llmFull])||0,
      fallbacks:parseInt(r[cols.fallbacks])||0, newUsers:parseInt(r[cols.newUsers])||0,
    }));
  } catch(e) { return []; }
}


// ============================================================
// SECTION 13: RATE LIMITING & LANGUAGE DETECTION
// ============================================================

function checkRateLimit(userId) {
  const cache = CacheService.getScriptCache();
  const key   = SYSTEM_CONFIG.CACHE.RATE_PREFIX + userId + '_' + new Date().toDateString();
  const count = parseInt(cache.get(key) || '0');
  const limit = SYSTEM_CONFIG.RATE_LIMIT_PER_DAY;
  if (count >= limit) return false;
  cache.put(key, String(count + 1), SYSTEM_CONFIG.CACHE.RATE_TTL);
  return true;
}

/**
 * checkVisitorRateLimit(userId)
 * คืนค่า: { allowed: bool, remaining: number }
 */
function checkVisitorRateLimit(userId) {
  const cache   = CacheService.getScriptCache();
  const key     = SYSTEM_CONFIG.CACHE.VISITOR_RATE_PREFIX + userId + '_' + new Date().toDateString();
  const count   = parseInt(cache.get(key) || '0');
  const limit   = parseInt(_getBotConfigValue('VISITOR_QUESTION_LIMIT', String(SYSTEM_CONFIG.VISITOR_QUESTION_LIMIT)), 10);
  if (count >= limit) return { allowed:false, remaining:0 };
  cache.put(key, String(count + 1), SYSTEM_CONFIG.CACHE.RATE_TTL);
  return { allowed:true, remaining:limit - count - 1 };
}

function detectLanguage(message) {
  if (!message) return 'th';
  const letters = message.replace(/\s+/g, '');
  if (letters.length === 0) return 'th';
  let asciiCount = 0;
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) asciiCount++;
  }
  return (asciiCount / letters.length) >= SYSTEM_CONFIG.ENGLISH_CHAR_RATIO ? 'en' : 'th';
}


// ============================================================
// SECTION 14: STATE MACHINE HELPERS
// ============================================================

// ─── Registration State ──────────────────────────────────────

function saveRegState(userId, stateObj) {
  const key = SYSTEM_CONFIG.CACHE.REG_STATE_PREFIX + userId;
  CacheService.getScriptCache().put(key, JSON.stringify(stateObj), SYSTEM_CONFIG.CACHE.STATE_TTL);
}

function getRegState(userId) {
  const key    = SYSTEM_CONFIG.CACHE.REG_STATE_PREFIX + userId;
  const cached = CacheService.getScriptCache().get(key);
  return cached ? JSON.parse(cached) : null;
}

function clearRegState(userId) {
  CacheService.getScriptCache().remove(SYSTEM_CONFIG.CACHE.REG_STATE_PREFIX + userId);
}

// ─── Admin State ─────────────────────────────────────────────

function saveAdminState(userId, stateObj) {
  const key = SYSTEM_CONFIG.CACHE.USER_STATE_PREFIX + userId;
  CacheService.getScriptCache().put(key, JSON.stringify(stateObj), SYSTEM_CONFIG.CACHE.STATE_TTL);
}

function getAdminState(userId) {
  const key    = SYSTEM_CONFIG.CACHE.USER_STATE_PREFIX + userId;
  const cached = CacheService.getScriptCache().get(key);
  return cached ? JSON.parse(cached) : null;
}

function clearAdminState(userId) {
  CacheService.getScriptCache().remove(SYSTEM_CONFIG.CACHE.USER_STATE_PREFIX + userId);
}

// ─── Pending Counts ──────────────────────────────────────────

function _getPendingCounts() {
  return {
    broadcasts: _getPendingBroadcastCount(),
    pushes:     _getPendingPushCount(),
    polls:      _getActivePollCount(),
  };
}

// ─── Quick Reply Templates ────────────────────────────────────

function _mainQuickReply() {
  return {
    items:[
      { type:'action', action:{ type:'message', label:'🎓 หลักสูตร',   text:'มีหลักสูตรอะไรบ้าง' } },
      { type:'action', action:{ type:'message', label:'📅 กิจกรรม',    text:'กิจกรรมที่กำลังจะมาถึง' } },
      { type:'action', action:{ type:'message', label:'📰 ข่าวสาร',    text:'ข่าวสารล่าสุด' } },
      { type:'action', action:{ type:'message', label:'📚 ช่วยเหลือ',   text:'/help' } },
    ]
  };
}

function _helpQuickReply(segment) {
  const items = [
    { type:'action', action:{ type:'message', label:'🎓 หลักสูตร',  text:'มีหลักสูตรอะไรบ้าง' } },
    { type:'action', action:{ type:'message', label:'📋 รับสมัคร',  text:'ขั้นตอนการรับสมัคร' } },
    { type:'action', action:{ type:'message', label:'📞 ติดต่อ',     text:'ติดต่อโรงเรียน' } },
  ];
  if (isRegistered(segment)) {
    items.push({ type:'action', action:{ type:'message', label:'🗳️ โหวต', text:'โหวต' } });
  }
  return { items };
}

function _visitorQuickReply(remaining) {
  return {
    items:[
      { type:'action', action:{ type:'message', label:`🎓 หลักสูตร${remaining >= 0 ? ` (${remaining})` : ''}`, text:'มีหลักสูตรอะไรบ้าง' } },
      { type:'action', action:{ type:'message', label:'📋 รับสมัคร', text:'ขั้นตอนการรับสมัคร' } },
      { type:'action', action:{ type:'postback', label:'🔑 ลงทะเบียน', data:'ACTION=SELECT_SEGMENT', displayText:'ลงทะเบียนใช้งาน' } },
    ]
  };
}
