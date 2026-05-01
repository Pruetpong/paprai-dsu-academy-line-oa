// ============================================================
// DSU ACADEMY LINE OA — Config.gs
// PAPRAI Platform | โรงเรียนสาธิต ม.ศิลปากร (มัธยมศึกษา)
// Version: 2.0.0 — Registration, Voting, News Feed
// ============================================================
// Section 1  : BOT_CONFIG
// Section 2  : SYSTEM_CONFIG
// Section 3  : MESSAGES (ป้าไพร Persona)
// Section 4  : PropertiesService Helpers
// Section 5  : Sheet Setup Functions (13 sheets / 3 spreadsheets)
// Section 6  : Rich Menu Setup (3 menus + placeholder)
// Section 7  : quickSetup()
// Section 8  : Admin Broadcast, Push & Poll Tools
// Section 9  : Flex Message Builders
// Section 10 : Private Utilities & Health Check
// ============================================================


// ============================================================
// SECTION 1: BOT_CONFIG
// ============================================================

const BOT_CONFIG = {
  BOT_NAME:              'DSU Academy',
  BOT_PERSONA:           'ป้าไพร',
  SCHOOL_NAME:           'โรงเรียนสาธิต มหาวิทยาลัยศิลปากร (มัธยมศึกษา)',
  VERSION:               '2.0.0',

  DEFAULT_AI_ENDPOINT:   'https://api.openai.com/v1/chat/completions',
  DEFAULT_AI_MODEL:      'gpt-4o-mini',
  AI_TEMPERATURE:        0.3,
  AI_MAX_TOKENS:         500,
  AI_POLISH_MAX_TOKENS:  800,
  AI_NEWS_MAX_TOKENS:    400,

  ENABLE_RATE_LIMIT:     true,
  ENABLE_LANG_DETECT:    true,
  ENABLE_CHAT_LOG:       true,

  // Visitor limit (override ได้จาก Bot_Config Sheet)
  VISITOR_QUESTION_LIMIT_DEFAULT: 5,
};


// ============================================================
// SECTION 2: SYSTEM_CONFIG
// ============================================================

const SYSTEM_CONFIG = {

  // ─── Google Sheets Names ─────────────────────────────────
  SHEETS: {
    // DSU_Main_DB
    USER_PROFILES:     'User_Profiles',
    CHAT_LOGS:         'Chat_Logs',
    ANALYTICS:         'Analytics_Daily',
    TEACHER_REGISTRY:  'Teacher_Registry',
    STUDENT_REGISTRY:  'Student_Registry',
    // DSU_Content_DB
    FAQ_MASTER:        'FAQ_Master',
    FAQ_CATEGORIES:    'FAQ_Categories',
    EVENT_CALENDAR:    'Event_Calendar',
    BOT_CONFIG_SHEET:  'Bot_Config',
    POLL_MASTER:       'Poll_Master',
    POLL_VOTES:        'Poll_Votes',
    NEWS_FEED_CACHE:   'News_Feed_Cache',
    // DSU_Broadcast_DB
    BROADCAST_QUEUE:   'Broadcast_Queue',
    PUSH_NOTIF:        'Push_Notifications',
  },

  // ─── User Roles ──────────────────────────────────────────
  ROLE: {
    SUPER_ADMIN: 'super_admin',
    ADMIN:       'admin',
    TEACHER:     'teacher',
    STAFF:       'staff',
    STUDENT:     'student',
    PARENT:      'parent',
    VISITOR:     'visitor',
  },

  // ─── คำเรียกตาม segment (ส่งเข้า LLM Context) ────────────
  ROLE_TITLE: {
    teacher: 'อาจารย์',
    staff:   'คุณ',
    student: 'นักเรียน',
    parent:  'ผู้ปกครอง',
    visitor: 'คุณ',
  },

  // ─── Segment → Rich Menu Property Key ────────────────────
  SEGMENT_MENU_KEY: {
    visitor: 'RICH_MENU_VISITOR',
    teacher: 'RICH_MENU_MEMBER',
    staff:   'RICH_MENU_MEMBER',
    parent:  'RICH_MENU_MEMBER',
    student: 'RICH_MENU_STUDENT',
  },

  // ─── CacheService Keys & TTL ─────────────────────────────
  CACHE: {
    USER_ROLE_PREFIX:   'user_role_',
    USER_STATE_PREFIX:  'user_state_',
    REG_STATE_PREFIX:   'reg_state_',
    FAQ_KB_ALL:         'faq_kb_all',
    FAQ_KB_CAT_PREFIX:  'faq_kb_cat_',
    FAQ_RAW:            'faq_raw_all',
    CATEGORIES_RAW:     'faq_categories_raw',
    RATE_PREFIX:        'rate_',
    VISITOR_RATE_PREFIX:'vrate_',
    NEWS_CACHE:         'news_feed_cache',
    STATE_TTL:          1800,
    ROLE_TTL:           300,
    FAQ_TTL:            600,
    RATE_TTL:           86400,
    NEWS_TTL:           21600,  // 6 ชั่วโมง
  },

  // ─── Rate Limits ─────────────────────────────────────────
  RATE_LIMIT_PER_DAY:         30,
  VISITOR_QUESTION_LIMIT:     5,   // override ได้จาก Bot_Config

  // ─── Registration State Machine ──────────────────────────
  REG_STATE: {
    IDLE:                   'IDLE',
    AWAIT_TEACHER_NAME:     'AWAIT_TEACHER_NAME',
    AWAIT_TEACHER_CONFIRM:  'AWAIT_TEACHER_CONFIRM',
    AWAIT_STUDENT_ID:       'AWAIT_STUDENT_ID',
    AWAIT_STUDENT_CONFIRM:  'AWAIT_STUDENT_CONFIRM',
    AWAIT_PARENT_STUDENT_ID:'AWAIT_PARENT_STUDENT_ID',
    AWAIT_PARENT_CONFIRM:   'AWAIT_PARENT_CONFIRM',
    RETRY_TEACHER:          'RETRY_TEACHER',
    RETRY_STUDENT:          'RETRY_STUDENT',
    RETRY_PARENT:           'RETRY_PARENT',
  },

  REG_MAX_RETRY: 2,  // จำนวนครั้งที่ลองได้ก่อนแจ้ง Admin

  // ─── Broadcast & Push Status ─────────────────────────────
  BROADCAST: {
    STATUS: {
      DRAFT:     'DRAFT',
      POLISHED:  'POLISHED',
      CONFIRMED: 'CONFIRMED',
      SENT:      'SENT',
    },
    PUSH_STATUS: {
      PENDING: 'PENDING',
      SENT:    'SENT',
    },
    BATCH_SLEEP_MS: 150,
  },

  // ─── Poll Status ─────────────────────────────────────────
  POLL_STATUS: {
    ACTIVE: 'active',
    CLOSED: 'closed',
  },

  // ─── Admin State ─────────────────────────────────────────
  ADMIN_STATE: {
    IDLE:             'IDLE',
    BROADCAST_LIST:   'BROADCAST_LIST',
    PUSH_LIST:        'PUSH_LIST',
    POLL_LIST:        'POLL_LIST',
  },

  // ─── Rich Menu Dimensions ────────────────────────────────
  RICH_MENU: {
    WIDTH:  2500,
    HEIGHT: 843,
  },

  // ─── Language Detection ──────────────────────────────────
  ENGLISH_CHAR_RATIO: 0.60,

  // ─── Escape Keywords ─────────────────────────────────────
  ESCAPE_KEYWORDS: ['ยกเลิก', 'cancel', 'ออก', 'exit', 'เมนู', 'menu'],

  // ─── News Feed ───────────────────────────────────────────
  NEWS_FETCH_COUNT_DEFAULT: 5,
};


// ============================================================
// SECTION 3: MESSAGES (ป้าไพร Persona)
// ============================================================

const MESSAGES = {

  // ─── Welcome ─────────────────────────────────────────────

  WELCOME_VISITOR: `สวัสดีค่ะ! ยินดีต้อนรับสู่ DSU Academy 🎉

ป้าไพรคือผู้ช่วยข้อมูลของโรงเรียนสาธิต
มหาวิทยาลัยศิลปากร (มัธยมศึกษา) ค่ะ

━━━━━━━━━━━━━━━━━━
📌 ป้าไพรช่วยตอบเรื่อง
━━━━━━━━━━━━━━━━━━

🎓 หลักสูตรทั้ง 4 แบบ
📋 ขั้นตอนการรับสมัคร
💰 ค่าใช้จ่ายและทุนการศึกษา
📞 ข้อมูลติดต่อโรงเรียน

กรุณาเลือกว่าคุณเป็นใครนะคะ
เพื่อให้ป้าไพรดูแลได้เหมาะสมที่สุดค่ะ 😊`,

  WELCOME_TEACHER: function(name) {
    return `ยินดีต้อนรับอาจารย์${name ? ' ' + name : ''}ค่ะ! 👩‍🏫

ป้าไพรยินดีให้บริการข้อมูลของโรงเรียน
สาธิต ม.ศิลปากร (มัธยมศึกษา) ค่ะ

━━━━━━━━━━━━━━━━━━
พิมพ์คำถามได้เลยนะคะ
หรือกดเมนูด้านล่างค่ะ 😊`;
  },

  WELCOME_STAFF: function(name) {
    return `ยินดีต้อนรับ${name ? 'คุณ ' + name : 'คุณ'}ค่ะ! 🙏

ป้าไพรยินดีให้บริการข้อมูลของโรงเรียน
สาธิต ม.ศิลปากร (มัธยมศึกษา) ค่ะ

━━━━━━━━━━━━━━━━━━
พิมพ์คำถามได้เลยนะคะ
หรือกดเมนูด้านล่างค่ะ 😊`;
  },

  WELCOME_STUDENT: function(name, cls, room) {
    return `ยินดีต้อนรับนักเรียน${name ? ' ' + name : ''}ค่ะ! 🌟${cls && room ? '\n📚 ' + cls + '/' + room : ''}

ป้าไพรคือผู้ช่วยข้อมูลของโรงเรียนค่ะ
พิมพ์คำถามได้เลยนะคะ ป้าไพรพร้อมช่วยเสมอค่ะ 😊`;
  },

  WELCOME_PARENT: function(studentName) {
    return `ยินดีต้อนรับผู้ปกครองค่ะ! 🙏${studentName ? '\n👦 บุตรหลาน: ' + studentName : ''}

ป้าไพรยินดีให้บริการข้อมูลของโรงเรียน
สาธิต ม.ศิลปากร (มัธยมศึกษา) ค่ะ

━━━━━━━━━━━━━━━━━━
พิมพ์คำถามได้เลยนะคะ
หรือกดเมนูด้านล่างค่ะ 😊`;
  },

  WELCOME_EN: `Hello! Welcome to DSU Academy 🎉

I'm PAPRAI, your virtual assistant for
Demonstration School of Silpakorn University.

Please select your role below so I can
serve you better! 😊`,

  // ─── Segment Selection ────────────────────────────────────
  SEGMENT_PROMPT: `กรุณาเลือกว่าคุณเป็นใครนะคะ
เพื่อให้ป้าไพรบริการคุณได้เหมาะสมที่สุดค่ะ 😊`,

  // ─── Registration ─────────────────────────────────────────

  REG_ASK_TEACHER_NAME:
`กรุณาพิมพ์ชื่อจริงของท่านค่ะ
(เฉพาะชื่อ ไม่ต้องใส่นามสกุล)

ตัวอย่าง: สมชาย`,

  REG_ASK_STUDENT_ID:
`กรุณาพิมพ์รหัสนักเรียน 5 หลักค่ะ
ป้าไพรจะค้นหาข้อมูลให้นะคะ 😊

ตัวอย่าง: 25001`,

  REG_ASK_PARENT_ID:
`กรุณาพิมพ์รหัสประจำตัวนักเรียน
ของบุตรหลานท่านค่ะ (5 หลัก)

ตัวอย่าง: 25001`,

  REG_INVALID_STUDENT_ID:
`ขออภัยค่ะ รหัสนักเรียนต้องเป็นตัวเลข 5 หลักนะคะ 🙏
กรุณาลองใหม่อีกครั้งได้เลยค่ะ

ตัวอย่าง: 25001`,

  REG_NOT_FOUND_TEACHER:
`ป้าไพรไม่พบชื่อนี้ในระบบค่ะ 🙏
กรุณาตรวจสอบการสะกดชื่อแล้วลองใหม่อีกครั้งนะคะ

ถ้ายังไม่พบ กรุณาติดต่อผู้ดูแลระบบค่ะ
📞 034-109686 ต่อ 206906`,

  REG_NOT_FOUND_STUDENT:
`ป้าไพรไม่พบรหัสนักเรียนนี้ในระบบค่ะ 🙏
กรุณาตรวจสอบรหัสแล้วลองใหม่อีกครั้งนะคะ

ถ้ายังไม่พบ กรุณาติดต่อฝ่ายทะเบียนค่ะ
📞 034-109686 ต่อ 206914`,

  REG_NOT_FOUND_PARENT:
`ป้าไพรไม่พบรหัสนักเรียนนี้ในระบบค่ะ 🙏
กรุณาตรวจสอบรหัสแล้วลองใหม่อีกครั้งนะคะ

ถ้ายังไม่พบ กรุณาติดต่อฝ่ายทะเบียนค่ะ
📞 034-109686 ต่อ 206914`,

  REG_ALREADY_REGISTERED:
`ท่านลงทะเบียนในระบบแล้วค่ะ 😊
ไม่จำเป็นต้องลงทะเบียนซ้ำนะคะ

พิมพ์คำถามได้เลยค่ะ ป้าไพรพร้อมช่วยเสมอค่ะ 🌟`,

  REG_CONTACT_ADMIN:
`ป้าไพรไม่สามารถยืนยันข้อมูลได้ค่ะ 🙏
กรุณาติดต่อผู้ดูแลระบบโดยตรงนะคะ

📞 034-109686 ต่อ 206906
⏰ วันจันทร์-ศุกร์ เวลา 08:00-16:30 น.`,

  REG_SUCCESS_TEACHER: function(name, position) {
    const title = position === 'staff' ? 'คุณ' : 'อาจารย์';
    return `✅ ลงทะเบียนเรียบร้อยแล้วค่ะ!\n\nยินดีต้อนรับ${title} ${name} ค่ะ 😊\nขอให้ใช้งานระบบ DSU Academy ได้อย่างสะดวกนะคะ`;
  },

  REG_SUCCESS_STUDENT: function(name, cls, room) {
    return `✅ ลงทะเบียนเรียบร้อยแล้วค่ะ!\n\nยินดีต้อนรับนักเรียน ${name} ค่ะ 🌟\nชั้น ${cls} ห้อง ${room}\n\nพิมพ์คำถามได้เลยนะคะ 😊`;
  },

  REG_SUCCESS_PARENT: function(studentName, cls, room) {
    return `✅ ลงทะเบียนเรียบร้อยแล้วค่ะ!\n\nยินดีต้อนรับผู้ปกครองของ\n👦 ${studentName} ชั้น ${cls} ห้อง ${room} ค่ะ 😊\n\nพิมพ์คำถามได้เลยนะคะ`;
  },

  // ─── Visitor Rate Limit ───────────────────────────────────

  VISITOR_LIMIT_WARNING: function(remaining) {
    return `💡 เหลืออีก ${remaining} คำถามสำหรับวันนี้ค่ะ\nลงทะเบียนเพื่อใช้งานได้ไม่จำกัดนะคะ 😊`;
  },

  VISITOR_LIMIT_REACHED:
`ครบจำกัดการใช้งานสำหรับวันนี้แล้วค่ะ 🙏

━━━━━━━━━━━━━━━━━━
กรุณาลงทะเบียนเพื่อใช้งานได้ไม่จำกัดนะคะ
กดปุ่มด้านล่างเพื่อเริ่มลงทะเบียนได้เลยค่ะ 😊`,

  // ─── Voting ──────────────────────────────────────────────

  VOTE_NO_ACTIVE_POLLS:
`ไม่มีการโหวตที่เปิดอยู่ตอนนี้ค่ะ 😊
คอยติดตามข่าวสารจากโรงเรียนนะคะ`,

  VOTE_NEED_REGISTER:
`ขออภัยค่ะ ต้องลงทะเบียนก่อนจึงจะโหวตได้นะคะ 🙏
กดปุ่มด้านล่างเพื่อเริ่มลงทะเบียนได้เลยค่ะ 😊`,

  VOTE_ALREADY_VOTED: function(optionText) {
    return `คุณโหวตไปแล้วค่ะ ✅\nตัวเลือกที่เลือก: ${optionText}\n\nขอบคุณที่ร่วมโหวตนะคะ 😊`;
  },

  VOTE_SUCCESS: function(optionText) {
    return `✅ บันทึกผลโหวตเรียบร้อยแล้วค่ะ!\nตัวเลือกของคุณ: ${optionText}\n\nขอบคุณที่ร่วมโหวตนะคะ 😊`;
  },

  VOTE_CLOSED: `การโหวตนี้ปิดแล้วค่ะ 😊\nขอบคุณที่ให้ความสนใจนะคะ`,

  VOTE_PERMISSION_DENIED: `ขออภัยค่ะ การโหวตนี้ไม่เปิดให้กลุ่มของคุณค่ะ 🙏`,

  // ─── News Feed ───────────────────────────────────────────

  NEWS_LOADING:  `ป้าไพรกำลังดึงข่าวล่าสุดจากโรงเรียนค่ะ ⏳\nกรุณารอสักครู่นะคะ`,
  NEWS_NOT_FOUND:`ขณะนี้ไม่พบข่าวสารล่าสุดค่ะ 😊\nกรุณาลองใหม่ในภายหลัง หรือเยี่ยมชมเว็บไซต์โรงเรียนได้เลยนะคะ`,

  // ─── Events ──────────────────────────────────────────────

  EVENTS_EMPTY: `ยังไม่มีกิจกรรมที่จะมาถึงในขณะนี้ค่ะ 😊\nคอยติดตามข่าวสารจากโรงเรียนนะคะ`,

  // ─── Errors ──────────────────────────────────────────────

  ERROR_GENERAL:
`ป้าไพรขออภัยด้วยนะคะ 🙏
เกิดข้อผิดพลาดชั่วคราวค่ะ
กรุณาลองใหม่อีกครั้งนะคะ`,

  ERROR_TIMEOUT:
`ป้าไพรขออภัยด้วยนะคะ 🙏
ระบบใช้เวลานานกว่าปกติค่ะ
กรุณาลองใหม่สักครู่นะคะ`,

  ERROR_PERMISSION:
`ขออภัยค่ะ ป้าไพรไม่พบสิทธิ์ของคุณในระบบค่ะ
กรุณาติดต่อผู้ดูแลระบบนะคะ 🙏`,

  ERROR_RATE_LIMIT:
`ขออภัยด้วยนะคะ 🙏
วันนี้มีการสอบถามเกินกำหนดแล้วค่ะ

กรุณาลองใหม่พรุ่งนี้
หรือติดต่อโรงเรียนได้โดยตรงนะคะ
📞 034-109686
⏰ จ-ศ 08:00-16:30 น.`,

  // ─── FAQ Fallback ─────────────────────────────────────────

  FALLBACK_TH:
`ป้าไพรขออภัยนะคะ 🙏
ยังไม่พบข้อมูลที่ตรงกับคำถามนี้ค่ะ

━━━━━━━━━━━━━━━━━━
💡 ลองถามด้วยคำที่ต่างออกไป
หรือติดต่อโรงเรียนโดยตรงนะคะ

📞 034-109686 ต่อ 206906
📧 satitdsu@su.ac.th
⏰ จ-ศ 08:00-16:30 น.

มีอะไรให้ป้าไพรช่วยอีกไหมคะ 😊`,

  FALLBACK_EN:
`I'm sorry, I couldn't find an answer to your question. 🙏

Please try rephrasing, or contact us directly:
📞 034-109686 ext. 206906
📧 satitdsu@su.ac.th
⏰ Mon-Fri, 08:00-16:30

Feel free to ask anything else! 😊`,

  // ─── Help Menu ───────────────────────────────────────────

  HELP_MENU:
`📚 วิธีใช้งาน DSU Academy

━━━━━━━━━━━━━━━━━━
💬 สอบถามข้อมูล
━━━━━━━━━━━━━━━━━━

พิมพ์คำถามได้เลยค่ะ เช่น
📌 "มีหลักสูตรอะไรบ้าง"
📌 "รับสมัครเมื่อไหร่"
📌 "ค่าเทอมเท่าไหร่"
📌 "ติดต่อโรงเรียน"

━━━━━━━━━━━━━━━━━━
🗳️ ฟีเจอร์พิเศษ (ต้องลงทะเบียน)
━━━━━━━━━━━━━━━━━━

พิมพ์ "โหวต"     — ร่วมโหวตกิจกรรม
พิมพ์ "ข่าว"     — ข่าวสารล่าสุด
พิมพ์ "กิจกรรม"  — กิจกรรมที่กำลังจะมา

━━━━━━━━━━━━━━━━━━
📞 ติดต่อโรงเรียน
━━━━━━━━━━━━━━━━━━

โทร: 034-109686
อีเมล: satitdsu@su.ac.th
⏰ จ-ศ 08:00-16:30 น.

มีอะไรให้ป้าไพรช่วยอีกไหมคะ 😊`,

  // ─── Admin Panel ─────────────────────────────────────────

  ADMIN_WELCOME:
`สวัสดีค่ะ! 🔧

ยินดีต้อนรับผู้ดูแลระบบ DSU Academy
ป้าไพรพร้อมช่วยงานคุณแล้วค่ะ 😊

━━━━━━━━━━━━━━━━━━
กดปุ่มด้านล่างเพื่อเริ่มงานได้เลยนะคะ`,

  ADMIN_BROADCAST_EMPTY:   `ไม่พบ Broadcast ที่รอดำเนินการค่ะ 😊`,
  ADMIN_PUSH_EMPTY:        `ไม่พบ Push Notification ที่รอส่งค่ะ 😊`,
  ADMIN_POLL_EMPTY:        `ไม่พบ Poll ที่เปิดอยู่ค่ะ 😊`,
  ADMIN_NOT_FOUND:         `ป้าไพรไม่พบข้อมูลที่ร้องขอค่ะ\nกรุณาตรวจสอบ ID ใน Google Sheets นะคะ 🙏`,
  ADMIN_NOT_CONFIRMED:
`⚠️ Broadcast นี้ยังไม่ได้รับการยืนยันค่ะ
กรุณาเปลี่ยน status เป็น CONFIRMED ใน Sheets ก่อนนะคะ`,

  ADMIN_POLISH_SUCCESS: function(bcId) {
    return `✅ Polish เรียบร้อยแล้วค่ะ!\n\nBroadcast ID: ${bcId}\nกรุณาตรวจสอบใน Sheets แล้วเปลี่ยน status เป็น CONFIRMED นะคะ 😊`;
  },

  ADMIN_BROADCAST_SENT: function(bcId, count) {
    return `✅ ส่ง Broadcast เรียบร้อยแล้วค่ะ!\n\nID: ${bcId}\nจำนวนผู้รับ: ${count} คน 😊`;
  },

  ADMIN_PUSH_SENT: function(pushId, count) {
    return `✅ ส่ง Push Notification เรียบร้อยแล้วค่ะ!\n\nID: ${pushId}\nจำนวนผู้รับ: ${count} คน`;
  },

  ADMIN_POLL_CLOSED: function(pollId, total) {
    return `✅ ปิด Poll ${pollId} เรียบร้อยแล้วค่ะ!\nจำนวนผู้โหวตทั้งหมด: ${total} คน`;
  },

  CANCELLED:
`✅ ยกเลิกเรียบร้อยแล้วนะคะ
มีอะไรให้ป้าไพรช่วยอีกไหมคะ 😊`,
};


// ============================================================
// SECTION 4: PropertiesService Helpers
// ============================================================

const VALID_PROP_KEYS = [
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'API_KEY',
  'AI_ENDPOINT',
  'AI_MODEL',
  'SPREADSHEET_MAIN_ID',
  'SPREADSHEET_CONTENT_ID',
  'SPREADSHEET_BROADCAST_ID',
  'SUPER_ADMIN_USER_ID',
  'ADMIN_USER_IDS',
  'RICH_MENU_ID_VISITOR',
  'RICH_MENU_ID_MEMBER',
  'RICH_MENU_ID_STUDENT',
];

function setProp(key, value) {
  if (!VALID_PROP_KEYS.includes(key)) throw new Error(`setProp: Invalid key "${key}"`);
  PropertiesService.getScriptProperties().setProperty(key, String(value));
}

function getProps() {
  const p = PropertiesService.getScriptProperties();
  return {
    LINE_TOKEN:         p.getProperty('LINE_CHANNEL_ACCESS_TOKEN'),
    LINE_SECRET:        p.getProperty('LINE_CHANNEL_SECRET'),
    API_KEY:            p.getProperty('API_KEY'),
    AI_ENDPOINT:        p.getProperty('AI_ENDPOINT')  || BOT_CONFIG.DEFAULT_AI_ENDPOINT,
    AI_MODEL:           p.getProperty('AI_MODEL')     || BOT_CONFIG.DEFAULT_AI_MODEL,
    MAIN_SHEET_ID:      p.getProperty('SPREADSHEET_MAIN_ID'),
    CONTENT_SHEET_ID:   p.getProperty('SPREADSHEET_CONTENT_ID'),
    BROADCAST_SHEET_ID: p.getProperty('SPREADSHEET_BROADCAST_ID'),
    SUPER_ADMIN_ID:     p.getProperty('SUPER_ADMIN_USER_ID'),
    ADMIN_IDS:          JSON.parse(p.getProperty('ADMIN_USER_IDS') || '[]'),
    RICH_MENU_VISITOR:  p.getProperty('RICH_MENU_ID_VISITOR'),
    RICH_MENU_MEMBER:   p.getProperty('RICH_MENU_ID_MEMBER'),
    RICH_MENU_STUDENT:  p.getProperty('RICH_MENU_ID_STUDENT'),
  };
}

function maskValue(v) {
  if (!v || v.length < 8) return '****';
  return v.substring(0, 4) + '****' + v.slice(-4);
}

// ─── Spreadsheet Access Helpers ──────────────────────────────

function getMainSheet(sheetName) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_MAIN_ID');
  if (!id) throw new Error('SPREADSHEET_MAIN_ID not configured');
  return SpreadsheetApp.openById(id).getSheetByName(sheetName);
}

function getContentSheet(sheetName) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_CONTENT_ID');
  if (!id) throw new Error('SPREADSHEET_CONTENT_ID not configured');
  return SpreadsheetApp.openById(id).getSheetByName(sheetName);
}

function getBroadcastSheet(sheetName) {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_BROADCAST_ID');
  if (!id) throw new Error('SPREADSHEET_BROADCAST_ID not configured');
  return SpreadsheetApp.openById(id).getSheetByName(sheetName);
}


// ============================================================
// SECTION 5: Sheet Setup Functions
// ============================================================

// ─── DSU_Main_DB ─────────────────────────────────────────────

function setupUserProfilesSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
  else s.clearContents();
  const h = ['userId','displayName','segment','richMenuId','language','joinDate','lastActive','status'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1A5276').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(1,200); s.setColumnWidth(4,220);
  logInfo('Setup','User_Profiles ready');
}

function setupChatLogsSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.CHAT_LOGS);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.CHAT_LOGS);
  else s.clearContents();
  const h = ['timestamp','userId','segment','userMessage','botReply','source','category','responseMs'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1A5276').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(4,300); s.setColumnWidth(5,300);
  logInfo('Setup','Chat_Logs ready');
}

function setupAnalyticsSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.ANALYTICS);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.ANALYTICS);
  else s.clearContents();
  const h = ['date','totalMessages','keywordHits','llmTargeted','llmFull','fallbacks','newUsers','activeUsers'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1A5276').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  logInfo('Setup','Analytics_Daily ready');
}

function setupTeacherRegistrySheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.TEACHER_REGISTRY);
  else s.clearContents();
  const h = ['teacherId','firstName','lastName','fullName','department','position','userId','registeredAt','status'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1A5276').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(4,180); // fullName
  s.setColumnWidth(5,150); // department
  // ตัวอย่างข้อมูล (Admin ลบทิ้งและกรอกจริงก่อน launch)
  const now = new Date();
  const demo = [
    ['T001','สมชาย','ใจดี','สมชาย ใจดี','คณิตศาสตร์','teacher','','',  'active'],
    ['T002','สมหญิง','รักดี','สมหญิง รักดี','ฝ่ายธุรการ','staff',   '','',  'active'],
  ];
  s.getRange(2,1,demo.length,h.length).setValues(demo);
  logInfo('Setup','Teacher_Registry ready');
}

function setupStudentRegistrySheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.STUDENT_REGISTRY);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.STUDENT_REGISTRY);
  else s.clearContents();
  const h = ['studentId','firstName','lastName','fullName','class','room','year','userId','parentUserId','registeredAt','status'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1A5276').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(4,180); // fullName
  const demo = [
    ['25001','สมศรี','มีสุข','สมศรี มีสุข','ม.1','1/1','2568','','','','active'],
    ['25002','สมศักดิ์','ดีงาม','สมศักดิ์ ดีงาม','ม.1','1/2','2568','','','','active'],
  ];
  s.getRange(2,1,demo.length,h.length).setValues(demo);
  logInfo('Setup','Student_Registry ready');
}

// ─── DSU_Content_DB ──────────────────────────────────────────

function setupFaqMasterSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.FAQ_MASTER);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.FAQ_MASTER);
  else s.clearContents();
  const h = ['faqId','category','question','answer','keywords','active','lastUpdated'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(3,250); s.setColumnWidth(4,420); s.setColumnWidth(5,280);
  const now = new Date();
  const seed = [
    ['FAQ001','ข้อมูลทั่วไป','โรงเรียนสาธิตศิลปากรตั้งอยู่ที่ไหน','ตั้งอยู่ที่เลขที่ 6 ถนนราชมรรคาใน ตำบลพระปฐมเจดีย์ อำเภอเมือง จังหวัดนครปฐม 73000 ค่ะ','ที่ตั้ง,อยู่ที่ไหน,สถานที่,address,location','TRUE',now],
    ['FAQ002','ข้อมูลทั่วไป','โรงเรียนเปิดสอนระดับชั้นอะไรบ้าง','เปิดสอนระดับมัธยมศึกษาตอนต้นและตอนปลาย (ม.1-ม.6) ค่ะ','ระดับชั้น,เปิดสอน,ม.1,ม.4,มัธยม,grade','TRUE',now],
    ['FAQ003','ข้อมูลทั่วไป','เวลาเรียนของโรงเรียนเป็นอย่างไร','เรียนวันจันทร์ถึงศุกร์ เวลา 08:00-16:00 น. ค่ะ','เวลาเรียน,ตาราง,เวลา,schedule,เปิดเรียน','TRUE',now],
    ['FAQ004','รับสมัคร','โรงเรียนเปิดรับสมัครเมื่อไหร่','เปิดรับสมัครประมาณเดือนพฤศจิกายนของทุกปีค่ะ ติดตามข่าวสารได้ที่ LINE OA นี้ได้เลยนะคะ','สมัคร,รับสมัคร,ยื่น,เปิดรับ,admission,apply','TRUE',now],
    ['FAQ005','รับสมัคร','ค่าสมัครเท่าไหร่','ค่าสมัครสอบ 500 บาท ไม่คืนไม่ว่ากรณีใดค่ะ','ค่าสมัคร,ราคา,สมัครเสียเงิน,fee,500','TRUE',now],
    ['FAQ006','รับสมัคร','เอกสารอะไรบ้างที่ต้องใช้สมัคร','เอกสารที่ต้องใช้ได้แก่ สำเนาทะเบียนบ้าน, สำเนาบัตรประชาชน, รูปถ่าย 1 นิ้ว 2 รูป และใบรับรองผลการเรียนค่ะ','เอกสาร,เตรียม,ใช้อะไรบ้าง,document','TRUE',now],
    ['FAQ007','รับสมัคร','มีทุนการศึกษาไหม','มีทุนการศึกษาสำหรับนักเรียนที่มีผลการเรียนดีและครอบครัวมีฐานะยากจนค่ะ สอบถามรายละเอียดได้ที่ฝ่ายทะเบียนนะคะ','ทุน,scholarship,ยากจน,เรียนฟรี,ทุนการศึกษา','TRUE',now],
    ['FAQ008','หลักสูตร-STEAM','หลักสูตร STEAM Robotics Program คืออะไร','หลักสูตรห้องเรียนพิเศษบูรณาการ เน้นการเรียนรู้ผ่านวิทยาศาสตร์ เทคโนโลยี วิศวกรรม ศิลปะ คณิตศาสตร์ และเทคโนโลยีหุ่นยนต์ เหมาะกับนักเรียนที่ชอบคิดวิเคราะห์และสร้างสรรค์นวัตกรรมค่ะ','steam,robotics,หุ่นยนต์,โรบอท,สะเต็ม','TRUE',now],
    ['FAQ009','หลักสูตร-PU-HSET','หลักสูตร PU-HSET Program คืออะไร','หลักสูตรเตรียมอุดมฯ สายวิทยาศาสตร์สุขภาพและวิศวกรรมเทคโนโลยี เน้นเตรียมความพร้อมสู่คณะแพทย์ ทันตแพทย์ เภสัช วิศวกรรมศาสตร์ และวิทยาศาสตร์สุขภาพค่ะ','puhset,pu-hset,เตรียมอุดม,แพทย์,ทันตแพทย์,เภสัช,วิศวะ,hset','TRUE',now],
    ['FAQ010','หลักสูตร-Trilingual','หลักสูตร Trilingual Program มีอะไรพิเศษ','หลักสูตรห้องเรียนพิเศษไตรภาษา เน้นภาษาไทย อังกฤษ และจีนอย่างเข้มข้น พร้อมโอกาสแลกเปลี่ยนวัฒนธรรมและการเรียนรู้ระดับสากล มี Native Speakers สอนเต็มเวลาค่ะ','trilingual,ไตรภาษา,จีน,สามภาษา,ภาษาต่างประเทศ,ภาษาอังกฤษ','TRUE',now],
    ['FAQ011','หลักสูตร-ArtDesign','หลักสูตร Art & Design Program เหมาะกับใคร','เหมาะกับนักเรียนที่รักศิลปะ ดีไซน์ สร้างสรรค์ เตรียมสู่คณะสถาปัตยกรรม/ออกแบบค่ะ','art,design,ศิลปะ,ดีไซน์,สถาปัตย์,วาดรูป,ออกแบบ','TRUE',now],
    ['FAQ012','ติดต่อ','ติดต่อโรงเรียนได้อย่างไร','📞 034-109686 ต่อ 206906 (ธุรการ), 206914 (ทะเบียน), 206913 (การเงิน)\n📧 satitdsu@su.ac.th\n⏰ จันทร์-ศุกร์ 08:00-16:30 น.ค่ะ','ติดต่อ,โทร,เบอร์,อีเมล,contact,phone,email','TRUE',now],
  ];
  s.getRange(2,1,seed.length,h.length).setValues(seed);
  logInfo('Setup',`FAQ_Master ready (${seed.length} rows)`);
}

function setupFaqCategoriesSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.FAQ_CATEGORIES);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.FAQ_CATEGORIES);
  else s.clearContents();
  const h = ['category','categoryKeywords','displayName','promptHint','active'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  const cats = [
    ['รับสมัคร','สมัคร,รับสมัคร,ยื่น,คัดเลือก,สอบเข้า,admission,apply','ข้อมูลการรับสมัคร','ตอบเฉพาะข้อมูลการรับสมัครและเอกสาร','TRUE'],
    ['หลักสูตร-STEAM','steam,robotics,หุ่นยนต์,โรบอท,สะเต็ม','หลักสูตร STEAM','ตอบเกี่ยวกับหลักสูตร STEAM Robotics Program','TRUE'],
    ['หลักสูตร-PU-HSET','puhset,hset,เตรียมอุดม,แพทย์,ทันตแพทย์,เภสัช,วิศวะ','หลักสูตร PU-HSET','ตอบเกี่ยวกับหลักสูตร PU-HSET Program','TRUE'],
    ['หลักสูตร-Trilingual','trilingual,ไตรภาษา,จีน,สามภาษา','หลักสูตร Trilingual','ตอบเกี่ยวกับหลักสูตร Trilingual Program','TRUE'],
    ['หลักสูตร-ArtDesign','art,design,ศิลปะ,ดีไซน์,สถาปัตย์,วาดรูป','หลักสูตร Art & Design','ตอบเกี่ยวกับหลักสูตร Art & Design Program','TRUE'],
    ['ค่าใช้จ่าย','ค่าเทอม,ค่าใช้จ่าย,ค่าธรรมเนียม,เสียเงิน,ทุน,fee,tuition','ค่าใช้จ่ายและทุน','ตอบเกี่ยวกับค่าใช้จ่ายและทุนการศึกษา','TRUE'],
    ['ติดต่อ','ติดต่อ,โทร,เบอร์,อีเมล,contact,phone,email','ข้อมูลติดต่อ','ตอบเกี่ยวกับการติดต่อโรงเรียน','TRUE'],
    ['ข้อมูลทั่วไป','โรงเรียน,ตั้งอยู่,ที่ตั้ง,เวลา,ประวัติ,general,about','ข้อมูลทั่วไป','ตอบข้อมูลทั่วไปเกี่ยวกับโรงเรียน','TRUE'],
  ];
  s.getRange(2,1,cats.length,h.length).setValues(cats);
  logInfo('Setup','FAQ_Categories ready');
}

function setupEventCalendarSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.EVENT_CALENDAR);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.EVENT_CALENDAR);
  else s.clearContents();
  const h = ['eventId','eventDate','title','description','targetSegment','notified','createdAt'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(3,200); s.setColumnWidth(4,350);
  logInfo('Setup','Event_Calendar ready');
}

function setupBotConfigSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.BOT_CONFIG_SHEET);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.BOT_CONFIG_SHEET);
  else s.clearContents();
  const h = ['key','value','description','updatedAt'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  const now = new Date();
  const cfg = [
    ['RATE_LIMIT_PER_DAY',    '30',                    'คำถามสูงสุดต่อคนต่อวัน (registered)',now],
    ['VISITOR_QUESTION_LIMIT','5',                     'คำถามสูงสุดต่อวัน (visitor)',now],
    ['LLM_MAX_TOKENS',        '500',                   'ขนาด response LLM (FAQ)',now],
    ['LLM_TEMPERATURE',       '0.3',                   'ความหลากหลายคำตอบ LLM',now],
    ['KB_CACHE_TTL',          '600',                   'วินาที Cache FAQ',now],
    ['CONTACT_PHONE',         '034-109686',            'เบอร์ติดต่อโรงเรียน',now],
    ['CONTACT_EMAIL',         'satitdsu@su.ac.th',     'อีเมลโรงเรียน',now],
    ['SCHOOL_HOURS',          'จ-ศ 08:00-16:30 น.',   'เวลาทำการ',now],
    ['NEWS_SOURCE_URL',       'https://satit.su.ac.th','URL ดึงข่าวโรงเรียน',now],
    ['NEWS_FETCH_COUNT',      '5',                     'จำนวนข่าวที่ดึงต่อครั้ง',now],
    ['NEWS_CACHE_HOURS',      '6',                     'ชั่วโมง Cache ข่าว',now],
    ['VOTE_ALLOW_CHANGE',     'FALSE',                 'อนุญาตเปลี่ยนผลโหวตหรือไม่',now],
  ];
  s.getRange(2,1,cfg.length,h.length).setValues(cfg);
  logInfo('Setup','Bot_Config ready');
}

function setupPollMasterSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
  else s.clearContents();
  const h = ['pollId','title','description','option1','option2','option3','option4',
             'targetSegment','startDate','endDate','status','resultVisible','createdBy','createdAt'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(2,200); s.setColumnWidth(3,250);
  logInfo('Setup','Poll_Master ready');
}

function setupPollVotesSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.POLL_VOTES);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.POLL_VOTES);
  else s.clearContents();
  const h = ['voteId','pollId','userId','segment','selectedOption','votedAt'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  logInfo('Setup','Poll_Votes ready');
}

function setupNewsFeedCacheSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.NEWS_FEED_CACHE);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.NEWS_FEED_CACHE);
  else s.clearContents();
  const h = ['newsId','title','summary','sourceUrl','publishedDate','fetchedAt','active'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#1B5E20').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(2,250); s.setColumnWidth(3,350); s.setColumnWidth(4,250);
  logInfo('Setup','News_Feed_Cache ready');
}

// ─── DSU_Broadcast_DB ────────────────────────────────────────

function setupBroadcastQueueSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
  else s.clearContents();
  const h = ['broadcastId','messageType','draft','polished','status','targetSegment',
             'createdBy','createdAt','sentAt','recipientCount'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#4A235A').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(3,350); s.setColumnWidth(4,350);
  logInfo('Setup','Broadcast_Queue ready');
}

function setupPushNotifSheet(ss) {
  let s = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.PUSH_NOTIF);
  if (!s) s = ss.insertSheet(SYSTEM_CONFIG.SHEETS.PUSH_NOTIF);
  else s.clearContents();
  const h = ['pushId','message','targetSegment','eventRef','status','sentBy','sentAt','recipientCount'];
  s.getRange(1,1,1,h.length).setValues([h]).setBackground('#4A235A').setFontColor('#FFFFFF').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(2,350);
  logInfo('Setup','Push_Notifications ready');
}

// ─── Setup All Sheets ────────────────────────────────────────

function setupAllSheets() {
  const props = getProps();
  if (!props.MAIN_SHEET_ID || !props.CONTENT_SHEET_ID || !props.BROADCAST_SHEET_ID) {
    throw new Error('Spreadsheet IDs not set');
  }

  logInfo('Setup','📊 DSU_Main_DB...');
  const mainSS = SpreadsheetApp.openById(props.MAIN_SHEET_ID);
  setupUserProfilesSheet(mainSS);
  setupChatLogsSheet(mainSS);
  setupAnalyticsSheet(mainSS);
  setupTeacherRegistrySheet(mainSS);
  setupStudentRegistrySheet(mainSS);

  logInfo('Setup','📊 DSU_Content_DB...');
  const contentSS = SpreadsheetApp.openById(props.CONTENT_SHEET_ID);
  setupFaqMasterSheet(contentSS);
  setupFaqCategoriesSheet(contentSS);
  setupEventCalendarSheet(contentSS);
  setupBotConfigSheet(contentSS);
  setupPollMasterSheet(contentSS);
  setupPollVotesSheet(contentSS);
  setupNewsFeedCacheSheet(contentSS);

  logInfo('Setup','📊 DSU_Broadcast_DB...');
  const broadcastSS = SpreadsheetApp.openById(props.BROADCAST_SHEET_ID);
  setupBroadcastQueueSheet(broadcastSS);
  setupPushNotifSheet(broadcastSS);

  logInfo('Setup','✅ All 14 sheets ready!');
}


// ============================================================
// SECTION 6: Rich Menu Setup (3 Menus)
// ============================================================

function setupRichMenus() {
  const token = getProps().LINE_TOKEN;
  if (!token) throw new Error('LINE_TOKEN not set');

  logInfo('RichMenu','Creating 3 Rich Menus...');
  const visitorId = _createRichMenu(token, _buildRichMenuVisitor());
  const memberId  = _createRichMenu(token, _buildRichMenuMember());
  const studentId = _createRichMenu(token, _buildRichMenuStudent());
  if (!visitorId || !memberId || !studentId) throw new Error('Rich Menu creation failed');

  _uploadPlaceholderImage(token, visitorId, '1A5276', 'VISITOR');
  _uploadPlaceholderImage(token, memberId,  '1B5E20', 'MEMBER');
  _uploadPlaceholderImage(token, studentId, '4A235A', 'STUDENT');
  _setDefaultRichMenu(token, visitorId);

  setProp('RICH_MENU_ID_VISITOR', visitorId);
  setProp('RICH_MENU_ID_MEMBER',  memberId);
  setProp('RICH_MENU_ID_STUDENT', studentId);

  logInfo('RichMenu', `Visitor:${visitorId} Member:${memberId} Student:${studentId}`);
  return { visitorId, memberId, studentId };
}

function _buildRichMenuVisitor() {
  return {
    size: { width:2500, height:843 }, selected:true,
    name:'DSU_VISITOR', chatBarText:'📋 เมนูหลัก',
    areas:[
      { bounds:{x:0,   y:0,  width:833, height:421}, action:{type:'message',label:'หลักสูตร', text:'มีหลักสูตรอะไรบ้าง'} },
      { bounds:{x:833, y:0,  width:834, height:421}, action:{type:'message',label:'รับสมัคร', text:'ขั้นตอนการรับสมัคร'} },
      { bounds:{x:1667,y:0,  width:833, height:421}, action:{type:'message',label:'ช่วยเหลือ',text:'/help'} },
      { bounds:{x:0,   y:421,width:833, height:422}, action:{type:'message',label:'ค่าใช้จ่าย',text:'ค่าใช้จ่ายมีอะไรบ้าง'} },
      { bounds:{x:833, y:421,width:834, height:422}, action:{type:'message',label:'ติดต่อ',   text:'ติดต่อโรงเรียน'} },
      { bounds:{x:1667,y:421,width:833, height:422}, action:{type:'postback',label:'ลงทะเบียน',data:'ACTION=SELECT_SEGMENT',displayText:'ลงทะเบียน'} },
    ]
  };
}

function _buildRichMenuMember() {
  return {
    size: { width:2500, height:843 }, selected:true,
    name:'DSU_MEMBER', chatBarText:'📋 เมนูหลัก',
    areas:[
      { bounds:{x:0,   y:0,  width:833, height:421}, action:{type:'message',label:'ข่าวสาร',  text:'ข่าวสารล่าสุด'} },
      { bounds:{x:833, y:0,  width:834, height:421}, action:{type:'message',label:'กิจกรรม',  text:'กิจกรรมที่กำลังจะมาถึง'} },
      { bounds:{x:1667,y:0,  width:833, height:421}, action:{type:'message',label:'ช่วยเหลือ',text:'/help'} },
      { bounds:{x:0,   y:421,width:833, height:422}, action:{type:'message',label:'หลักสูตร', text:'มีหลักสูตรอะไรบ้าง'} },
      { bounds:{x:833, y:421,width:834, height:422}, action:{type:'message',label:'ติดต่อ',   text:'ติดต่อโรงเรียน'} },
      { bounds:{x:1667,y:421,width:833, height:422}, action:{type:'message',label:'เกี่ยวกับ',text:'เกี่ยวกับโรงเรียน'} },
    ]
  };
}

function _buildRichMenuStudent() {
  return {
    size: { width:2500, height:843 }, selected:true,
    name:'DSU_STUDENT', chatBarText:'📋 เมนูหลัก',
    areas:[
      { bounds:{x:0,   y:0,  width:833, height:421}, action:{type:'message',label:'ข่าวสาร',  text:'ข่าวสารล่าสุด'} },
      { bounds:{x:833, y:0,  width:834, height:421}, action:{type:'message',label:'กิจกรรม',  text:'กิจกรรมที่กำลังจะมาถึง'} },
      { bounds:{x:1667,y:0,  width:833, height:421}, action:{type:'message',label:'โหวต',     text:'โหวต'} },
      { bounds:{x:0,   y:421,width:833, height:422}, action:{type:'message',label:'หลักสูตร', text:'มีหลักสูตรอะไรบ้าง'} },
      { bounds:{x:833, y:421,width:834, height:422}, action:{type:'message',label:'ติดต่อ',   text:'ติดต่อโรงเรียน'} },
      { bounds:{x:1667,y:421,width:833, height:422}, action:{type:'message',label:'ช่วยเหลือ',text:'/help'} },
    ]
  };
}

function _createRichMenu(token, def) {
  try {
    const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/richmenu', {
      method:'post', contentType:'application/json',
      headers:{'Authorization':`Bearer ${token}`},
      payload:JSON.stringify(def), muteHttpExceptions:true,
    });
    if (res.getResponseCode() !== 200) { logInfo('RichMenu',`Create failed`,res.getContentText()); return null; }
    return JSON.parse(res.getContentText()).richMenuId;
  } catch(e) { logInfo('RichMenu','Error',e.message); return null; }
}

function _uploadPlaceholderImage(token, richMenuId, hexColor, label) {
  // สร้าง SVG placeholder ที่มี grid ปุ่มมองเห็นได้
  const btnLabels = {
    VISITOR: ['หลักสูตร','รับสมัคร','ช่วยเหลือ','ค่าใช้จ่าย','ติดต่อ','ลงทะเบียน'],
    MEMBER:  ['ข่าวสาร','กิจกรรม','ช่วยเหลือ','หลักสูตร','ติดต่อ','เกี่ยวกับ'],
    STUDENT: ['ข่าวสาร','กิจกรรม','โหวต','หลักสูตร','ติดต่อ','ช่วยเหลือ'],
  };
  const labels = btnLabels[label] || ['1','2','3','4','5','6'];
  const c = hexColor;

  // SVG 2500×843 แบ่ง 6 ช่อง (3×2)
  const positions = [
    {x:0,    y:0,   w:833, h:421},
    {x:833,  y:0,   w:834, h:421},
    {x:1667, y:0,   w:833, h:421},
    {x:0,    y:421, w:833, h:422},
    {x:833,  y:421, w:834, h:422},
    {x:1667, y:421, w:833, h:422},
  ];
  const rects = positions.map((p, i) => `
    <rect x="${p.x+4}" y="${p.y+4}" width="${p.w-8}" height="${p.h-8}"
          rx="16" fill="#${c}" opacity="${i % 2 === 0 ? '1' : '0.85'}"/>
    <text x="${p.x + p.w/2}" y="${p.y + p.h/2 + 16}"
          font-family="sans-serif" font-size="72" fill="white"
          text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>
  `).join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="2500" height="843" viewBox="0 0 2500 843">
  <rect width="2500" height="843" fill="#1a1a2e"/>
  ${rects}
  <line x1="833" y1="0" x2="833" y2="843" stroke="white" stroke-width="4" opacity="0.3"/>
  <line x1="1667" y1="0" x2="1667" y2="843" stroke="white" stroke-width="4" opacity="0.3"/>
  <line x1="0" y1="421" x2="2500" y2="421" stroke="white" stroke-width="4" opacity="0.3"/>
</svg>`;

  try {
    const blob = Utilities.newBlob(svg, 'image/svg+xml', `richmenu_${label}.svg`);
    const res  = UrlFetchApp.fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
        method: 'post',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'image/svg+xml' },
        payload: blob,
        muteHttpExceptions: true,
      }
    );
    logInfo('RichMenu', `Placeholder SVG uploaded: ${label} (${res.getResponseCode()})`);
  } catch(e) {
    logInfo('RichMenu', `Image upload skipped: ${label}`, e.message);
  }
}

function _setDefaultRichMenu(token, richMenuId) {
  UrlFetchApp.fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method:'post', headers:{'Authorization':`Bearer ${token}`}, muteHttpExceptions:true,
  });
  logInfo('RichMenu',`Default set: ${richMenuId}`);
}


// ============================================================
// SECTION 7: quickSetup()
// ============================================================

function quickSetup() {
  // ══════════════════════════════════════════════════════════
  // 🔑 กรอกข้อมูลทั้งหมดในส่วนนี้ก่อน Run!
  // ══════════════════════════════════════════════════════════
  const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR-LINE-CHANNEL-ACCESS-TOKEN';
  const LINE_CHANNEL_SECRET       = 'YOUR-LINE-CHANNEL-SECRET';
  const API_KEY                   = 'YOUR-OPENAI-COMPATIBLE-API-KEY';
  const AI_ENDPOINT               = 'https://api.openai.com/v1/chat/completions';
  const AI_MODEL                  = 'gpt-4o-mini';
  const SUPER_ADMIN_USER_ID       = 'YOUR-LINE-USER-ID';
  const ADMIN_USER_IDS            = [];
  const SPREADSHEET_MAIN_ID       = 'YOUR-DSU-MAIN-DB-SPREADSHEET-ID';
  const SPREADSHEET_CONTENT_ID    = 'YOUR-DSU-CONTENT-DB-SPREADSHEET-ID';
  const SPREADSHEET_BROADCAST_ID  = 'YOUR-DSU-BROADCAST-DB-SPREADSHEET-ID';
  // ══════════════════════════════════════════════════════════

  const mustFill = [LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, API_KEY,
                    SUPER_ADMIN_USER_ID, SPREADSHEET_MAIN_ID, SPREADSHEET_CONTENT_ID, SPREADSHEET_BROADCAST_ID];
  if (mustFill.some(v => String(v).startsWith('YOUR-'))) {
    console.error('❌ กรุณาแก้ไขค่าทั้งหมดใน quickSetup() ก่อน Run');
    return;
  }

  console.log('🚀 quickSetup() v2.0 DSU Academy...\n');
  console.log('1️⃣  บันทึก PropertiesService...');
  setProp('LINE_CHANNEL_ACCESS_TOKEN', LINE_CHANNEL_ACCESS_TOKEN);
  setProp('LINE_CHANNEL_SECRET',       LINE_CHANNEL_SECRET);
  setProp('API_KEY',                   API_KEY);
  setProp('AI_ENDPOINT',               AI_ENDPOINT);
  setProp('AI_MODEL',                  AI_MODEL);
  setProp('SUPER_ADMIN_USER_ID',       SUPER_ADMIN_USER_ID);
  setProp('ADMIN_USER_IDS',            JSON.stringify(ADMIN_USER_IDS));
  setProp('SPREADSHEET_MAIN_ID',       SPREADSHEET_MAIN_ID);
  setProp('SPREADSHEET_CONTENT_ID',    SPREADSHEET_CONTENT_ID);
  setProp('SPREADSHEET_BROADCAST_ID',  SPREADSHEET_BROADCAST_ID);
  console.log('   ✅ OK\n');

  console.log('2️⃣  ตั้งค่า Google Sheets (14 sheets)...');
  setupAllSheets();
  console.log('   ✅ OK\n');

  console.log('3️⃣  สร้าง Rich Menus...');
  setupRichMenus();
  console.log('   ✅ OK\n');

  console.log('4️⃣  ตรวจสอบ...');
  const check = validateSetup();
  console.log('\n══════════════════════════════════════════');
  if (check.valid) {
    console.log('✅  quickSetup() v2.0 เสร็จสมบูรณ์!');
    console.log('\n📋 ขั้นตอนต่อไป:');
    console.log('   1. กรอกข้อมูลอาจารย์ใน Teacher_Registry (DSU_Main_DB)');
    console.log('   2. กรอกข้อมูลนักเรียนใน Student_Registry (DSU_Main_DB)');
    console.log('   3. Deploy Web App (Anyone / Execute as Me)');
    console.log('   4. ตั้ง Webhook URL ใน LINE Developers Console');
  } else {
    console.error(`❌ ยังไม่สมบูรณ์:`);
    check.issues.forEach(i => console.error(`   - ${i}`));
  }
  console.log('══════════════════════════════════════════');
}

function validateSetup() {
  const issues = [];
  const p = getProps();
  if (!p.LINE_TOKEN)         issues.push('LINE_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งค่า');
  if (!p.LINE_SECRET)        issues.push('LINE_CHANNEL_SECRET ไม่ได้ตั้งค่า');
  if (!p.API_KEY)            issues.push('API_KEY ไม่ได้ตั้งค่า');
  if (!p.MAIN_SHEET_ID)      issues.push('SPREADSHEET_MAIN_ID ไม่ได้ตั้งค่า');
  if (!p.CONTENT_SHEET_ID)   issues.push('SPREADSHEET_CONTENT_ID ไม่ได้ตั้งค่า');
  if (!p.BROADCAST_SHEET_ID) issues.push('SPREADSHEET_BROADCAST_ID ไม่ได้ตั้งค่า');
  if (!p.SUPER_ADMIN_ID)     issues.push('SUPER_ADMIN_USER_ID ไม่ได้ตั้งค่า');
  if (!p.RICH_MENU_VISITOR)  issues.push('RICH_MENU_ID_VISITOR ยังไม่สร้าง');
  return { valid: issues.length === 0, issues };
}


// ============================================================
// SECTION 8: Admin Tools (Broadcast, Push, Poll)
// ============================================================

function polishBroadcastDraft(broadcastId) {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const cols    = _headerMap(headers, ['broadcastId','draft','polished','status']);
    let targetRow = -1, draft = '';
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.broadcastId]) === String(broadcastId) &&
          data[i][cols.status] === SYSTEM_CONFIG.BROADCAST.STATUS.DRAFT) {
        targetRow = i + 1; draft = data[i][cols.draft]; break;
      }
    }
    if (targetRow === -1) return { success:false, error:`ไม่พบ "${broadcastId}" ที่มี status DRAFT` };
    if (!draft || String(draft).trim() === '') return { success:false, error:'draft ว่างเปล่าค่ะ' };

    const systemPrompt =
`คุณเป็นผู้ช่วยปรับภาษาประกาศของโรงเรียนสาธิต มหาวิทยาลัยศิลปากร
ปรับข้อความ draft ให้: อ่านง่าย สุภาพ คงใจความเดิม ไม่ใช้ Markdown
เพิ่ม emoji 1-3 ตัว ปิดท้ายด้วย "ฝ่ายวิชาการและนวัตกรรมการเรียนรู้ DSU Academy"
ตอบกลับเฉพาะข้อความที่ปรับแล้วเท่านั้น`;

    const polished = _callLLM(getProps(), systemPrompt, String(draft), BOT_CONFIG.AI_POLISH_MAX_TOKENS);
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      sheet.getRange(targetRow, cols.polished + 1).setValue(polished);
      sheet.getRange(targetRow, cols.status   + 1).setValue(SYSTEM_CONFIG.BROADCAST.STATUS.POLISHED);
    } finally { lock.releaseLock(); }
    return { success:true, polished, broadcastId };
  } catch(e) { logInfo('polishBroadcast','❌',e.message); return { success:false, error:e.message }; }
}

function sendBroadcast(broadcastId) {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const cols    = _headerMap(headers, ['broadcastId','messageType','polished','status','targetSegment','sentAt','recipientCount']);
    let targetRow = -1, bcData = null;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.broadcastId]) === String(broadcastId) &&
          data[i][cols.status] === SYSTEM_CONFIG.BROADCAST.STATUS.CONFIRMED) {
        targetRow = i + 1;
        bcData = { messageType:data[i][cols.messageType]||'text', polished:String(data[i][cols.polished]), targetSegment:String(data[i][cols.targetSegment]||'all') };
        break;
      }
    }
    if (!bcData) return { success:false, error:`ไม่พบ "${broadcastId}" ที่มี status CONFIRMED` };
    const userIds = _getUserIdsBySegment(bcData.targetSegment);
    if (userIds.length === 0) return { success:false, error:'ไม่พบผู้ใช้' };
    const messages = _buildBroadcastMessages(bcData);
    const token = getProps().LINE_TOKEN;
    let count = 0;
    userIds.forEach(uid => {
      try { _pushLineMessage(token, uid, messages); count++; } catch(e) {}
      Utilities.sleep(SYSTEM_CONFIG.BROADCAST.BATCH_SLEEP_MS);
    });
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      sheet.getRange(targetRow, cols.status         + 1).setValue(SYSTEM_CONFIG.BROADCAST.STATUS.SENT);
      sheet.getRange(targetRow, cols.sentAt         + 1).setValue(new Date());
      sheet.getRange(targetRow, cols.recipientCount + 1).setValue(count);
    } finally { lock.releaseLock(); }
    return { success:true, count };
  } catch(e) { logInfo('sendBroadcast','❌',e.message); return { success:false, error:e.message }; }
}

function sendPushNotification(pushId) {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.PUSH_NOTIF);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const cols    = _headerMap(headers, ['pushId','message','targetSegment','status','sentAt','recipientCount']);
    let targetRow = -1, pushData = null;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.pushId]) === String(pushId) &&
          data[i][cols.status] === SYSTEM_CONFIG.BROADCAST.PUSH_STATUS.PENDING) {
        targetRow = i + 1;
        pushData = { message:String(data[i][cols.message]), targetSegment:String(data[i][cols.targetSegment]||'all') };
        break;
      }
    }
    if (!pushData) return { success:false, error:`ไม่พบ "${pushId}" ที่มี status PENDING` };
    const userIds = _getUserIdsBySegment(pushData.targetSegment);
    if (userIds.length === 0) return { success:false, error:'ไม่พบผู้ใช้' };
    const token = getProps().LINE_TOKEN;
    const message = [{ type:'text', text:pushData.message }];
    let count = 0;
    userIds.forEach(uid => {
      try { _pushLineMessage(token, uid, message); count++; } catch(e) {}
      Utilities.sleep(SYSTEM_CONFIG.BROADCAST.BATCH_SLEEP_MS);
    });
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      sheet.getRange(targetRow, cols.status         + 1).setValue(SYSTEM_CONFIG.BROADCAST.PUSH_STATUS.SENT);
      sheet.getRange(targetRow, cols.sentAt         + 1).setValue(new Date());
      sheet.getRange(targetRow, cols.recipientCount + 1).setValue(count);
    } finally { lock.releaseLock(); }
    return { success:true, count };
  } catch(e) { logInfo('sendPush','❌',e.message); return { success:false, error:e.message }; }
}

function closePoll(pollId) {
  try {
    const sheet   = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const cols    = _headerMap(headers, ['pollId','status']);
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols.pollId]) === String(pollId)) {
        const lock = LockService.getScriptLock();
        try {
          lock.waitLock(10000);
          sheet.getRange(i + 1, cols.status + 1).setValue(SYSTEM_CONFIG.POLL_STATUS.CLOSED);
        } finally { lock.releaseLock(); }
        const total = _getPollResults(pollId).total;
        return { success:true, total };
      }
    }
    return { success:false, error:'ไม่พบ Poll' };
  } catch(e) { return { success:false, error:e.message }; }
}


// ============================================================
// SECTION 9: Flex Message Builders
// ============================================================

// ─── Segment Selection ────────────────────────────────────────
function buildSegmentSelectFlex() {
  return {
    type:'flex', altText:'กรุณาเลือกประเภทผู้ใช้ค่ะ',
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1A5276', paddingAll:'14px',
        contents:[
          { type:'text', text:'👤 คุณเป็นใครคะ?', color:'#FFFFFF', weight:'bold', size:'md' },
          { type:'text', text:'กรุณาเลือกเพื่อรับบริการที่เหมาะสม', color:'#AED6F1', size:'xs' },
        ]
      },
      body:{ type:'box', layout:'vertical', paddingAll:'14px',
        contents:[{ type:'text', text:'ป้าไพรจะปรับเนื้อหาให้เหมาะสม\nตามประเภทผู้ใช้ของคุณนะคะ 😊', size:'sm', wrap:true, color:'#555555' }]
      },
      footer:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'10px',
        contents:[
          { type:'button', style:'primary', color:'#1A5276', height:'sm',
            action:{ type:'postback', label:'👩‍🏫 อาจารย์/บุคลากร', data:'ACTION=SET_SEGMENT|SEG=teacher', displayText:'ฉันเป็นอาจารย์/บุคลากร' } },
          { type:'button', style:'primary', color:'#4A235A', height:'sm',
            action:{ type:'postback', label:'🎓 นักเรียน', data:'ACTION=SET_SEGMENT|SEG=student', displayText:'ฉันเป็นนักเรียน' } },
          { type:'button', style:'primary', color:'#1B5E20', height:'sm',
            action:{ type:'postback', label:'👪 ผู้ปกครอง', data:'ACTION=SET_SEGMENT|SEG=parent', displayText:'ฉันเป็นผู้ปกครอง' } },
        ]
      }
    }
  };
}

// ─── Teacher Select (Carousel) ───────────────────────────────
function buildTeacherSelectFlex(matches) {
  const bubbles = matches.slice(0, 10).map(t => ({
    type:'bubble', size:'kilo',
    body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
      contents:[
        { type:'text', text:t.fullName, weight:'bold', size:'md', wrap:true },
        { type:'text', text:t.department, size:'sm', color:'#888888' },
        { type:'text', text:t.position === 'teacher' ? '👩‍🏫 อาจารย์' : '🏢 บุคลากร', size:'xs', color:'#555555' },
      ]
    },
    footer:{ type:'box', layout:'vertical', paddingAll:'8px',
      contents:[{ type:'button', style:'primary', color:'#1A5276', height:'sm',
        action:{ type:'postback', label:'✅ ใช่ ฉันคือท่านนี้',
          data:`ACTION=REG_SELECT_TEACHER|TID=${t.teacherId}`, displayText:`ยืนยัน ${t.fullName}` } }]
    }
  }));
  return { type:'flex', altText:'กรุณาเลือกชื่อของท่าน', contents:{ type:'carousel', contents:bubbles } };
}

// ─── Student Confirm ─────────────────────────────────────────
function buildStudentConfirmFlex(student) {
  return {
    type:'flex', altText:'ยืนยันข้อมูลนักเรียน',
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#4A235A', paddingAll:'12px',
        contents:[{ type:'text', text:'🎓 ยืนยันข้อมูลนักเรียน', color:'#FFFFFF', weight:'bold', size:'sm' }]
      },
      body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
        contents:[
          _infoRow('รหัสนักเรียน', student.studentId),
          _infoRow('ชื่อ-นามสกุล', student.fullName),
          _infoRow('ชั้น/ห้อง',    `${student.class} / ${student.room}`),
          _infoRow('ปีการศึกษา',   student.year),
        ]
      },
      footer:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'8px',
        contents:[
          { type:'button', style:'primary', color:'#4A235A', height:'sm',
            action:{ type:'postback', label:'✅ ใช่ ฉันคือนักเรียนคนนี้',
              data:`ACTION=REG_CONFIRM_STUDENT|SID=${student.studentId}`, displayText:'ยืนยันตัวตน' } },
          { type:'button', style:'secondary', height:'sm',
            action:{ type:'postback', label:'❌ ไม่ใช่ กรอกรหัสใหม่',
              data:'ACTION=REG_RETRY_STUDENT', displayText:'กรอกรหัสใหม่' } },
        ]
      }
    }
  };
}

// ─── Parent Confirm ──────────────────────────────────────────
function buildParentConfirmFlex(student) {
  return {
    type:'flex', altText:'ยืนยันข้อมูลบุตรหลาน',
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1B5E20', paddingAll:'12px',
        contents:[{ type:'text', text:'👪 ยืนยันข้อมูลบุตรหลาน', color:'#FFFFFF', weight:'bold', size:'sm' }]
      },
      body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
        contents:[
          _infoRow('รหัสนักเรียน', student.studentId),
          _infoRow('ชื่อ-นามสกุล', student.fullName),
          _infoRow('ชั้น/ห้อง',    `${student.class} / ${student.room}`),
          _infoRow('ปีการศึกษา',   student.year),
          { type:'text', text:'นักเรียนคนนี้คือบุตรหลานของท่านใช่ไหมคะ?',
            size:'sm', wrap:true, color:'#555555', margin:'md' },
        ]
      },
      footer:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'8px',
        contents:[
          { type:'button', style:'primary', color:'#1B5E20', height:'sm',
            action:{ type:'postback', label:'✅ ใช่ นี่คือบุตรหลานของฉัน',
              data:`ACTION=REG_CONFIRM_PARENT|SID=${student.studentId}`, displayText:'ยืนยัน' } },
          { type:'button', style:'secondary', height:'sm',
            action:{ type:'postback', label:'❌ ไม่ใช่ กรอกรหัสใหม่',
              data:'ACTION=REG_RETRY_PARENT', displayText:'กรอกรหัสใหม่' } },
        ]
      }
    }
  };
}

// ─── Poll Flex ────────────────────────────────────────────────
function buildPollFlex(poll, hasVoted, userVoteOption) {
  const options = [poll.option1, poll.option2, poll.option3, poll.option4].filter(Boolean);
  const footerBtns = options.map((opt, idx) => {
    const optNum = idx + 1;
    const isChosen = hasVoted && String(userVoteOption) === String(optNum);
    return {
      type:'button', height:'sm',
      style: isChosen ? 'primary' : 'secondary',
      color: isChosen ? '#1A5276' : undefined,
      action: hasVoted
        ? { type:'postback', label:`${isChosen ? '✅ ' : ''}${opt}`, data:`ACTION=VOTE_VIEW|POLL=${poll.pollId}` }
        : { type:'postback', label:opt, data:`ACTION=VOTE_SUBMIT|POLL=${poll.pollId}|OPT=${optNum}`, displayText:`โหวต: ${opt}` },
    };
  });

  return {
    type:'flex', altText:poll.title,
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1A5276', paddingAll:'12px',
        contents:[
          { type:'text', text:'🗳️ ' + poll.title, color:'#FFFFFF', weight:'bold', size:'sm', wrap:true },
          { type:'text', text:`หมดเขต: ${String(poll.endDate).substring(0,10)}`, color:'#AED6F1', size:'xs' },
        ]
      },
      body:{ type:'box', layout:'vertical', paddingAll:'12px',
        contents:[
          { type:'text', text:poll.description || 'กรุณาเลือกตัวเลือกที่ต้องการค่ะ',
            size:'sm', wrap:true, color:'#555555' },
          hasVoted ? { type:'text', text:'✅ คุณโหวตแล้วค่ะ', size:'xs', color:'#27AE60', margin:'sm' } : { type:'filler' },
        ]
      },
      footer:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'8px', contents:footerBtns }
    }
  };
}

// ─── Poll Result Flex ─────────────────────────────────────────
function buildPollResultFlex(poll, results) {
  const options = [poll.option1, poll.option2, poll.option3, poll.option4].filter(Boolean);
  const rows = options.map((opt, idx) => {
    const cnt  = results[`option${idx+1}`] || 0;
    const pct  = results.total > 0 ? Math.round(cnt / results.total * 100) : 0;
    const barW = Math.max(pct, 3);
    return {
      type:'box', layout:'vertical', spacing:'xs', margin:'sm',
      contents:[
        { type:'box', layout:'horizontal',
          contents:[
            { type:'text', text:opt, size:'xs', flex:5, wrap:true },
            { type:'text', text:`${pct}% (${cnt})`, size:'xs', flex:2, align:'end', color:'#555555' },
          ]
        },
        { type:'box', layout:'vertical', backgroundColor:'#EEEEEE', cornerRadius:'4px', height:'8px',
          contents:[{
            type:'box', layout:'vertical', backgroundColor:'#1A5276',
            cornerRadius:'4px', width:`${barW}%`, contents:[{ type:'filler' }]
          }]
        },
      ]
    };
  });
  return {
    type:'flex', altText:`ผลโหวต: ${poll.title}`,
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1A5276', paddingAll:'12px',
        contents:[
          { type:'text', text:'📊 ผลโหวต', color:'#FFFFFF', weight:'bold', size:'sm' },
          { type:'text', text:poll.title, color:'#AED6F1', size:'xs', wrap:true },
        ]
      },
      body:{ type:'box', layout:'vertical', paddingAll:'12px', spacing:'sm',
        contents:[
          ...rows,
          { type:'separator', margin:'md' },
          { type:'text', text:`ผู้โหวตทั้งหมด: ${results.total} คน`, size:'xs', color:'#888888', margin:'sm' },
        ]
      }
    }
  };
}

// ─── Events Flex (Carousel) ───────────────────────────────────
function buildEventsFlex(events) {
  const bubbles = events.slice(0,5).map(ev => ({
    type:'bubble', size:'kilo',
    body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
      contents:[
        { type:'text', text:'📅 ' + String(ev.eventDate).substring(0,10), size:'xs', color:'#888888' },
        { type:'text', text:ev.title, weight:'bold', size:'sm', wrap:true },
        { type:'separator', margin:'sm' },
        { type:'text', text:ev.description || '', size:'xs', wrap:true, color:'#555555', margin:'sm' },
      ]
    }
  }));
  return { type:'flex', altText:'กิจกรรมที่กำลังจะมา', contents:{ type:'carousel', contents:bubbles } };
}

// ─── News Flex (Carousel) ─────────────────────────────────────
function buildNewsFlex(newsItems) {
  const bubbles = newsItems.slice(0,5).map(n => {
    const bubble = {
      type:'bubble', size:'kilo',
      body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
        contents:[
          { type:'text', text:String(n.publishedDate || '').substring(0,10), size:'xs', color:'#888888' },
          { type:'text', text:n.title, weight:'bold', size:'sm', wrap:true },
          { type:'separator', margin:'sm' },
          { type:'text', text:n.summary || '', size:'xs', wrap:true, color:'#555555', margin:'sm' },
        ]
      }
    };
    if (n.sourceUrl) {
      bubble.footer = { type:'box', layout:'vertical', paddingAll:'8px',
        contents:[{ type:'button', style:'secondary', height:'sm',
          action:{ type:'uri', label:'📖 อ่านต่อ', uri:n.sourceUrl } }]
      };
    }
    return bubble;
  });
  return { type:'flex', altText:'ข่าวสารจากโรงเรียน', contents:{ type:'carousel', contents:bubbles } };
}

// ─── Admin Panel ─────────────────────────────────────────────
function buildAdminPanelFlex(pendingBroadcasts, pendingPushes, activePollCount) {
  return {
    type:'flex', altText:'🔧 Admin Panel — DSU Academy',
    contents:{
      type:'bubble',
      header:{ type:'box', layout:'vertical', backgroundColor:'#1A5276', paddingAll:'12px',
        contents:[
          { type:'text', text:'🔧 Admin Panel', color:'#FFFFFF', weight:'bold', size:'md' },
          { type:'text', text:'DSU Academy', color:'#AED6F1', size:'xs' },
        ]
      },
      body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'14px',
        contents:[
          _statRow('📢 Broadcast รอดำเนินการ', pendingBroadcasts),
          _statRow('📣 Push รอส่ง',             pendingPushes),
          _statRow('🗳️ Poll เปิดอยู่',           activePollCount),
        ]
      },
      footer:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'10px',
        contents:[
          { type:'button', style:'primary', color:'#1A5276', height:'sm',
            action:{ type:'postback', label:'📢 จัดการ Broadcast', data:'ACTION=ADMIN_BROADCAST_LIST', displayText:'Broadcast' } },
          { type:'button', style:'secondary', height:'sm',
            action:{ type:'postback', label:'📣 ส่ง Push', data:'ACTION=ADMIN_PUSH_LIST', displayText:'Push' } },
          { type:'button', style:'secondary', height:'sm',
            action:{ type:'postback', label:'🗳️ จัดการ Poll', data:'ACTION=ADMIN_POLL_LIST', displayText:'Poll' } },
          { type:'button', style:'secondary', height:'sm',
            action:{ type:'postback', label:'📊 ดูสถิติ', data:'ACTION=ADMIN_STATS', displayText:'สถิติ' } },
        ]
      }
    }
  };
}

// ─── Broadcast Items ─────────────────────────────────────────
function buildBroadcastItemFlex(bcId, draft, status, targetSegment) {
  const statusColor = { DRAFT:'#F39C12', POLISHED:'#2980B9', CONFIRMED:'#27AE60' }[status] || '#888888';
  const preview     = String(draft).length > 90 ? String(draft).substring(0,90) + '...' : String(draft);
  const ftBtns      = [];
  if (status === SYSTEM_CONFIG.BROADCAST.STATUS.DRAFT)
    ftBtns.push({ type:'button', style:'primary', color:'#1A5276', height:'sm',
      action:{ type:'postback', label:'✨ Polish', data:`ACTION=ADMIN_POLISH|BC=${bcId}`, displayText:`Polish ${bcId}` } });
  if (status === SYSTEM_CONFIG.BROADCAST.STATUS.POLISHED || status === SYSTEM_CONFIG.BROADCAST.STATUS.CONFIRMED)
    ftBtns.push({ type:'button', style:'primary', color:'#27AE60', height:'sm',
      action:{ type:'postback', label:'📤 ยืนยันและส่ง', data:`ACTION=ADMIN_SEND|BC=${bcId}`, displayText:`ส่ง ${bcId}` } });
  return {
    type:'bubble', size:'kilo',
    body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'12px',
      contents:[
        { type:'box', layout:'horizontal', contents:[
          { type:'text', text:bcId, weight:'bold', size:'sm', flex:3 },
          { type:'text', text:status, size:'xs', color:statusColor, flex:2, align:'end' },
        ]},
        { type:'text', text:`🎯 ${targetSegment}`, size:'xs', color:'#888888' },
        { type:'separator', margin:'sm' },
        { type:'text', text:preview, size:'xs', wrap:true, color:'#555555', margin:'sm' },
      ]
    },
    footer: ftBtns.length > 0 ? { type:'box', layout:'vertical', spacing:'sm', paddingAll:'8px', contents:ftBtns } : undefined,
  };
}

function buildBroadcastFlexCard(title, body, buttons, imageUrl) {
  buttons  = buttons  || [];
  imageUrl = imageUrl || null;
  const bubble = {
    type:'bubble',
    body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'16px',
      contents:[
        { type:'text', text:title, weight:'bold', size:'lg', wrap:true, color:'#1A5276' },
        { type:'separator', margin:'sm' },
        { type:'text', text:body, size:'sm', wrap:true, color:'#333333', margin:'sm' },
      ]
    }
  };
  if (imageUrl) bubble.hero = { type:'image', url:imageUrl, size:'full', aspectRatio:'20:13', aspectMode:'cover' };
  if (buttons.length > 0) {
    bubble.footer = { type:'box', layout:'vertical', spacing:'sm', paddingAll:'8px',
      contents:buttons.slice(0,3).map((btn,idx) => ({
        type:'button', height:'sm',
        style: idx === 0 ? 'primary' : 'secondary',
        color: idx === 0 ? '#1A5276' : undefined,
        action: btn.action === 'url'
          ? { type:'uri',     label:btn.label, uri:btn.value }
          : { type:'message', label:btn.label, text:btn.value },
      }))
    };
  }
  return { type:'flex', altText:title, contents:bubble };
}

function buildPushItemFlex(pushId, message, targetSegment) {
  const preview = String(message).length > 90 ? String(message).substring(0,90) + '...' : String(message);
  return {
    type:'bubble', size:'kilo',
    body:{ type:'box', layout:'vertical', spacing:'sm', paddingAll:'12px',
      contents:[
        { type:'box', layout:'horizontal', contents:[
          { type:'text', text:pushId, weight:'bold', size:'sm', flex:3 },
          { type:'text', text:`🎯 ${targetSegment}`, size:'xs', color:'#888888', flex:2, align:'end' },
        ]},
        { type:'separator', margin:'sm' },
        { type:'text', text:preview, size:'xs', wrap:true, color:'#555555', margin:'sm' },
      ]
    },
    footer:{ type:'box', layout:'vertical', paddingAll:'8px',
      contents:[{ type:'button', style:'primary', color:'#1A5276', height:'sm',
        action:{ type:'postback', label:'📣 ส่งแจ้งเตือน',
          data:`ACTION=ADMIN_PUSH_SEND|PUSH=${pushId}`, displayText:`ส่ง ${pushId}` } }]
    }
  };
}

// ─── Shared Flex Helpers ─────────────────────────────────────
function _infoRow(label, value) {
  return {
    type:'box', layout:'horizontal',
    contents:[
      { type:'text', text:label, size:'xs', color:'#888888', flex:3 },
      { type:'text', text:String(value), size:'sm', flex:5, wrap:true },
    ]
  };
}

function _statRow(label, count) {
  return {
    type:'box', layout:'horizontal',
    contents:[
      { type:'text', text:label, size:'sm', flex:5 },
      { type:'text', text:`${count} รายการ`, size:'sm', weight:'bold', flex:2, align:'end',
        color: count > 0 ? '#E74C3C' : '#27AE60' },
    ]
  };
}


// ============================================================
// SECTION 10: Private Utilities & Health Check
// ============================================================

function _callLLM(props, systemPrompt, userMessage, maxTokens) {
  const payload = {
    model:       props.AI_MODEL,
    temperature: BOT_CONFIG.AI_TEMPERATURE,
    max_tokens:  maxTokens || BOT_CONFIG.AI_MAX_TOKENS,
    messages:[
      { role:'system', content:systemPrompt },
      { role:'user',   content:userMessage  },
    ],
  };
  const res = UrlFetchApp.fetch(props.AI_ENDPOINT, {
    method:'post', contentType:'application/json',
    headers:{'Authorization':`Bearer ${props.API_KEY}`},
    payload:JSON.stringify(payload), muteHttpExceptions:true,
  });
  if (res.getResponseCode() !== 200) throw new Error(`LLM error (${res.getResponseCode()}): ${res.getContentText()}`);
  return JSON.parse(res.getContentText()).choices[0].message.content.trim();
}

function _getUserIdsBySegment(targetSegment) {
  try {
    const sheet   = getMainSheet(SYSTEM_CONFIG.SHEETS.USER_PROFILES);
    const data    = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    const h  = data[0];
    const iU = h.indexOf('userId');
    const iS = h.indexOf('segment');
    const iSt= h.indexOf('status');
    return data.slice(1).filter(r => r[iSt] === 'active' && (targetSegment === 'all' || r[iS] === targetSegment))
               .map(r => r[iU]).filter(Boolean);
  } catch(e) { logInfo('_getUserIds','❌',e.message); return []; }
}

function _getPendingBroadcastCount() {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.BROADCAST_QUEUE);
    const data    = sheet.getDataRange().getValues();
    const iStatus = data[0].indexOf('status');
    const pending = [SYSTEM_CONFIG.BROADCAST.STATUS.DRAFT, SYSTEM_CONFIG.BROADCAST.STATUS.POLISHED];
    return data.slice(1).filter(r => pending.includes(r[iStatus])).length;
  } catch(e) { return 0; }
}

function _getPendingPushCount() {
  try {
    const sheet   = getBroadcastSheet(SYSTEM_CONFIG.SHEETS.PUSH_NOTIF);
    const data    = sheet.getDataRange().getValues();
    const iStatus = data[0].indexOf('status');
    return data.slice(1).filter(r => r[iStatus] === SYSTEM_CONFIG.BROADCAST.PUSH_STATUS.PENDING).length;
  } catch(e) { return 0; }
}

function _getActivePollCount() {
  try {
    const sheet   = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_MASTER);
    const data    = sheet.getDataRange().getValues();
    const iStatus = data[0].indexOf('status');
    return data.slice(1).filter(r => r[iStatus] === SYSTEM_CONFIG.POLL_STATUS.ACTIVE).length;
  } catch(e) { return 0; }
}

function _getPollResults(pollId) {
  try {
    const sheet   = getContentSheet(SYSTEM_CONFIG.SHEETS.POLL_VOTES);
    const data    = sheet.getDataRange().getValues();
    const h       = data[0];
    const iPoll   = h.indexOf('pollId');
    const iOpt    = h.indexOf('selectedOption');
    const votes   = data.slice(1).filter(r => String(r[iPoll]) === String(pollId));
    const results = { option1:0, option2:0, option3:0, option4:0, total:votes.length };
    votes.forEach(r => {
      const key = `option${r[iOpt]}`;
      if (results[key] !== undefined) results[key]++;
    });
    return results;
  } catch(e) { return { option1:0, option2:0, option3:0, option4:0, total:0 }; }
}

function _buildBroadcastMessages(bcData) {
  if (bcData.messageType === 'flex') {
    try { return [JSON.parse(bcData.polished)]; } catch(e) {}
  }
  return [{ type:'text', text:bcData.polished }];
}

function _pushLineMessage(token, userId, messages) {
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method:'post', contentType:'application/json',
    headers:{'Authorization':`Bearer ${token}`},
    payload:JSON.stringify({ to:userId, messages }), muteHttpExceptions:true,
  });
  if (res.getResponseCode() !== 200) throw new Error(`Push failed (${res.getResponseCode()})`);
}

function _headerMap(headers, keys) {
  const map = {};
  keys.forEach(k => { map[k] = headers.indexOf(k); });
  return map;
}

function _getBotConfigValue(key, defaultVal) {
  try {
    const sheet = getContentSheet(SYSTEM_CONFIG.SHEETS.BOT_CONFIG_SHEET);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) return data[i][1] !== '' ? data[i][1] : defaultVal;
    }
    return defaultVal;
  } catch(e) { return defaultVal; }
}

function logInfo(tag, message, detail) {
  const ts = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'HH:mm:ss');
  console.log(`[${ts}][${tag}] ${message}${detail ? ' — ' + detail : ''}`);
}

function systemHealthCheck() {
  const p = getProps();
  console.log('🔍 DSU Academy v2.0 Health Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`LINE Token         : ${maskValue(p.LINE_TOKEN)}`);
  console.log(`API Key            : ${maskValue(p.API_KEY)}`);
  console.log(`AI Model           : ${p.AI_MODEL}`);
  console.log(`Main Sheet         : ${maskValue(p.MAIN_SHEET_ID)}`);
  console.log(`Content Sheet      : ${maskValue(p.CONTENT_SHEET_ID)}`);
  console.log(`Broadcast Sheet    : ${maskValue(p.BROADCAST_SHEET_ID)}`);
  console.log(`Super Admin        : ${maskValue(p.SUPER_ADMIN_ID)}`);
  console.log(`Admin count        : ${p.ADMIN_IDS.length} คน`);
  console.log(`Rich Menu Visitor  : ${p.RICH_MENU_VISITOR || '❌'}`);
  console.log(`Rich Menu Member   : ${p.RICH_MENU_MEMBER  || '❌'}`);
  console.log(`Rich Menu Student  : ${p.RICH_MENU_STUDENT || '❌'}`);
  console.log(`Pending Broadcasts : ${_getPendingBroadcastCount()}`);
  console.log(`Pending Pushes     : ${_getPendingPushCount()}`);
  console.log(`Active Polls       : ${_getActivePollCount()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const check = validateSetup();
  console.log(check.valid ? '✅ ระบบพร้อมใช้งาน' : `❌ พบปัญหา ${check.issues.length} รายการ:`);
  check.issues.forEach(i => console.log(`   - ${i}`));
}
