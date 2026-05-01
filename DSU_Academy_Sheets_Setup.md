# DSU Academy LINE OA — คู่มือตั้งค่า Google Sheets
## Version 2.0.0 | PAPRAI Platform

---

## ภาพรวม Google Sheets (3 Spreadsheets / 14 Sheets)

| Spreadsheet | วัตถุประสงค์ | สิทธิ์เข้าถึง |
|---|---|---|
| **DSU_Main_DB** | ข้อมูลผู้ใช้และทะเบียน | Super Admin เท่านั้น |
| **DSU_Content_DB** | FAQ, กิจกรรม, Poll, ข่าว | Content Team + Super Admin |
| **DSU_Broadcast_DB** | Broadcast และ Push Queue | Broadcast Team + Super Admin |

> **หมายเหตุ:** ทุก Spreadsheet ต้องสร้างด้วย Google Account เดียวกับที่ Deploy GAS และแชร์ให้ทีมที่เกี่ยวข้องตามสิทธิ์ด้านบนเท่านั้น

---

## ขั้นตอนการสร้างและตั้งค่า

### ขั้นตอนที่ 1 — สร้าง Google Spreadsheets (3 ไฟล์)

1. สร้าง Google Spreadsheet ใหม่ 3 ไฟล์:
   - `DSU_Main_DB`
   - `DSU_Content_DB`
   - `DSU_Broadcast_DB`
2. คัดลอก **Spreadsheet ID** จาก URL ของแต่ละไฟล์:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
3. นำ ID ทั้ง 3 ไปกรอกใน `quickSetup()` ในไฟล์ `Config.gs`

### ขั้นตอนที่ 2 — กรอกข้อมูลใน `quickSetup()` และ Run

เปิด Apps Script Editor → แก้ไขค่าทั้งหมดใน `quickSetup()`:

```javascript
const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR-LINE-CHANNEL-ACCESS-TOKEN';
const LINE_CHANNEL_SECRET       = 'YOUR-LINE-CHANNEL-SECRET';
const API_KEY                   = 'YOUR-OPENAI-API-KEY';
const SUPER_ADMIN_USER_ID       = 'YOUR-LINE-USER-ID';
const SPREADSHEET_MAIN_ID       = 'xxx...xxx';  // จาก URL
const SPREADSHEET_CONTENT_ID    = 'xxx...xxx';
const SPREADSHEET_BROADCAST_ID  = 'xxx...xxx';
```

จากนั้น Run `quickSetup()` — ระบบจะสร้าง Sheets ทั้ง 14 แผ่นพร้อม Header อัตโนมัติ

### ขั้นตอนที่ 3 — กรอกข้อมูลก่อน Launch (**สำคัญมาก**)

กรอกข้อมูลต่อไปนี้ใน Sheets ก่อน Deploy:

| Sheet | ผู้รับผิดชอบ | ข้อมูลที่ต้องกรอก |
|---|---|---|
| `Teacher_Registry` | Admin ฝ่ายบุคคล | ข้อมูลอาจารย์/บุคลากรทุกท่าน |
| `Student_Registry` | Admin ฝ่ายทะเบียน | ข้อมูลนักเรียนทุกคน |
| `FAQ_Master` | Content Team | แก้ไข/เพิ่มคำถาม-คำตอบ |
| `Bot_Config` | Super Admin | ตรวจสอบและปรับค่าตามต้องการ |

---

## รายละเอียดแต่ละ Sheet

---

## 📊 DSU_Main_DB

### Sheet 1: `User_Profiles`

ระบบสร้างและอัปเดตอัตโนมัติ — **Admin ไม่ต้องกรอกเอง**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `userId` | String | `U1234567890abcdef` | LINE User ID (Primary Key) |
| `displayName` | String | `สมชาย ใจดี` | ชื่อที่แสดงใน LINE |
| `segment` | String | `teacher` | visitor / teacher / staff / student / parent |
| `richMenuId` | String | `richmenu-xxx` | Rich Menu ที่ผูกอยู่ |
| `language` | String | `th` | th หรือ en |
| `joinDate` | DateTime | `2025-01-10` | วันที่ Add Friend |
| `lastActive` | DateTime | `2025-01-15` | วันที่ใช้งานล่าสุด |
| `status` | String | `active` | active / blocked |

> ค่า `segment` ที่เป็นไปได้: `visitor`, `teacher`, `staff`, `student`, `parent`

---

### Sheet 2: `Chat_Logs`

ระบบบันทึกอัตโนมัติ — **Admin ไม่ต้องกรอกเอง**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `timestamp` | DateTime | `2025-01-10 10:30:00` | เวลาที่รับข้อความ |
| `userId` | String | `U1234...` | LINE User ID |
| `segment` | String | `student` | segment ของผู้ใช้ |
| `userMessage` | String | `ค่าเทอมเท่าไหร่` | ข้อความที่ผู้ใช้ส่งมา |
| `botReply` | String | `ค่าเทอมคือ...` | คำตอบของป้าไพร |
| `source` | String | `keyword` | keyword / llm_targeted / llm_full / fallback |
| `category` | String | `ค่าใช้จ่าย` | หมวดหมู่ FAQ |
| `responseMs` | Number | `1250` | เวลาตอบสนอง (มิลลิวินาที) |

---

### Sheet 3: `Analytics_Daily`

ระบบอัปเดตอัตโนมัติ — **Admin ดูได้อย่างเดียว**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `date` | String | `2025-01-10` | วันที่ |
| `totalMessages` | Number | `45` | ข้อความทั้งหมดในวันนั้น |
| `keywordHits` | Number | `20` | ตอบสำเร็จด้วย Keyword Match |
| `llmTargeted` | Number | `15` | ใช้ LLM แบบ Targeted |
| `llmFull` | Number | `8` | ใช้ LLM แบบ Full FAQ |
| `fallbacks` | Number | `2` | ตอบไม่สำเร็จ (Fallback) |
| `newUsers` | Number | `3` | ผู้ใช้ใหม่ในวันนั้น |
| `activeUsers` | Number | `12` | ผู้ใช้ที่ Active |

---

### Sheet 4: `Teacher_Registry` ⭐ กรอกก่อน Launch

**Admin ต้องกรอกข้อมูลก่อน Deploy ทุกครั้ง**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `teacherId` | String | `T001` | รหัสพนักงาน (กำหนดเอง, ห้ามซ้ำ) |
| `firstName` | String | `สมชาย` | ชื่อจริง (ใช้ค้นหา — **สำคัญ**) |
| `lastName` | String | `ใจดี` | นามสกุล |
| `fullName` | String | `สมชาย ใจดี` | ชื่อเต็ม (แสดงใน Flex Card) |
| `department` | String | `กลุ่มสาระคณิตศาสตร์` | แผนก/กลุ่มสาระ |
| `position` | String | `teacher` | **`teacher`** (อาจารย์) หรือ **`staff`** (บุคลากร) |
| `userId` | String | *(ว่าง)* | ระบบกรอกเองเมื่อลงทะเบียน |
| `registeredAt` | DateTime | *(ว่าง)* | ระบบกรอกเองเมื่อลงทะเบียน |
| `status` | String | `active` | `active` / `inactive` |

**ตัวอย่างข้อมูลที่ต้องกรอก:**

| teacherId | firstName | lastName | fullName | department | position | userId | registeredAt | status |
|---|---|---|---|---|---|---|---|---|
| T001 | สมชาย | ใจดี | สมชาย ใจดี | กลุ่มสาระคณิตศาสตร์ | teacher | *(ว่าง)* | *(ว่าง)* | active |
| T002 | สมหญิง | รักดี | สมหญิง รักดี | ฝ่ายธุรการ | staff | *(ว่าง)* | *(ว่าง)* | active |
| T003 | วิชัย | ดีมาก | วิชัย ดีมาก | กลุ่มสาระภาษาอังกฤษ | teacher | *(ว่าง)* | *(ว่าง)* | active |

> **คำแนะนำ:**
> - `teacherId` ควรใช้รูปแบบ T001, T002, ... หรือใช้รหัสพนักงานจริง
> - `firstName` ต้องกรอกให้ตรงกับที่อาจารย์จะพิมพ์ค้นหา (ค้นได้แบบ partial match)
> - `position` ต้องเป็น `teacher` หรือ `staff` เท่านั้น (ตัวพิมพ์เล็ก)
> - คอลัมน์ `userId` และ `registeredAt` ปล่อยว่างไว้ ระบบจะกรอกเองอัตโนมัติ

---

### Sheet 5: `Student_Registry` ⭐ กรอกก่อน Launch

**Admin ต้องกรอกข้อมูลก่อน Deploy ทุกครั้ง**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `studentId` | String | `25001` | รหัสนักเรียน 5 หลัก (Primary Key) |
| `firstName` | String | `สมศรี` | ชื่อจริง |
| `lastName` | String | `มีสุข` | นามสกุล |
| `fullName` | String | `สมศรี มีสุข` | ชื่อเต็ม (แสดงใน Flex Card) |
| `class` | String | `ม.1` | ระดับชั้น (ม.1 – ม.6) |
| `room` | String | `1/1` | ห้องเรียน |
| `year` | String | `2568` | ปีการศึกษา (พ.ศ.) |
| `userId` | String | *(ว่าง)* | LINE User ID นักเรียน (ระบบกรอกเอง) |
| `parentUserId` | String | *(ว่าง)* | LINE User ID ผู้ปกครอง (ระบบกรอกเอง) |
| `registeredAt` | DateTime | *(ว่าง)* | วันที่ลงทะเบียน (ระบบกรอกเอง) |
| `status` | String | `active` | `active` / `inactive` |

**ตัวอย่างข้อมูลที่ต้องกรอก:**

| studentId | firstName | lastName | fullName | class | room | year | userId | parentUserId | registeredAt | status |
|---|---|---|---|---|---|---|---|---|---|---|
| 25001 | สมศรี | มีสุข | สมศรี มีสุข | ม.1 | 1/1 | 2568 | *(ว่าง)* | *(ว่าง)* | *(ว่าง)* | active |
| 25002 | สมศักดิ์ | ดีงาม | สมศักดิ์ ดีงาม | ม.1 | 1/2 | 2568 | *(ว่าง)* | *(ว่าง)* | *(ว่าง)* | active |
| 25003 | มาลี | สุขใจ | มาลี สุขใจ | ม.4 | 4/1 | 2568 | *(ว่าง)* | *(ว่าง)* | *(ว่าง)* | active |

> **คำแนะนำ:**
> - `studentId` ต้องเป็นตัวเลข 5 หลักเสมอ (เช่น 25001 ไม่ใช่ 1 หรือ 001)
> - ถ้ามีนักเรียนย้ายออก → เปลี่ยน `status` เป็น `inactive` (อย่าลบแถว)
> - `parentUserId` จะถูกกรอกโดยระบบเมื่อผู้ปกครองลงทะเบียนด้วยรหัสของบุตรหลาน

---

## 📚 DSU_Content_DB

### Sheet 6: `FAQ_Master` ⭐ ตรวจสอบก่อน Launch

ระบบสร้าง seed data ให้อัตโนมัติ 12 รายการ — Content Team ควรตรวจสอบและเพิ่มเติม

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `faqId` | String | `FAQ001` | รหัส FAQ (ห้ามซ้ำ) |
| `category` | String | `รับสมัคร` | หมวดหมู่ (ต้องตรงกับ FAQ_Categories) |
| `question` | String | `เปิดรับสมัครเมื่อไหร่` | คำถามตัวอย่าง |
| `answer` | String | `เปิดรับสมัครประมาณ...` | คำตอบที่สมบูรณ์ |
| `keywords` | String | `สมัคร,รับสมัคร,ยื่น` | คำค้น (คั่นด้วย comma) |
| `active` | Boolean | `TRUE` | เปิด/ปิดใช้ FAQ นี้ |
| `lastUpdated` | DateTime | `2025-01-10` | วันที่แก้ไขล่าสุด |

**หมวดหมู่ที่มีอยู่แล้ว:**

| หมวดหมู่ | เนื้อหา |
|---|---|
| ข้อมูลทั่วไป | ที่ตั้ง, ระดับชั้น, เวลาเรียน |
| รับสมัคร | ขั้นตอน, เอกสาร, ค่าสมัคร |
| หลักสูตร-STEAM | รายละเอียด STEAM Robotics |
| หลักสูตร-PU-HSET | รายละเอียด PU-HSET |
| หลักสูตร-Trilingual | รายละเอียด Trilingual |
| หลักสูตร-ArtDesign | รายละเอียด Art & Design |
| ค่าใช้จ่าย | ค่าเทอม, ค่าธรรมเนียม, ทุน |
| ติดต่อ | เบอร์โทร, อีเมล, เวลาทำการ |

> **การเพิ่ม FAQ ใหม่:** เพิ่มแถวต่อท้าย ใส่ `faqId` ใหม่ที่ไม่ซ้ำ และตั้ง `active` เป็น `TRUE`
> **การปิด FAQ ชั่วคราว:** เปลี่ยน `active` จาก `TRUE` เป็น `FALSE`

---

### Sheet 7: `FAQ_Categories`

ระบบสร้างให้อัตโนมัติ — สามารถเพิ่มหมวดหมู่ใหม่ได้

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `category` | String | `รับสมัคร` | ชื่อหมวดหมู่ (ต้องตรงกับ FAQ_Master) |
| `categoryKeywords` | String | `สมัคร,รับสมัคร,ยื่น` | คำที่ trigger หมวดนี้ |
| `displayName` | String | `ข้อมูลการรับสมัคร` | ชื่อแสดงผล |
| `promptHint` | String | `ตอบเฉพาะข้อมูลการรับสมัคร` | คำแนะนำเพิ่มเติมสำหรับ LLM |
| `active` | Boolean | `TRUE` | เปิด/ปิดหมวดหมู่นี้ |

---

### Sheet 8: `Event_Calendar`

Admin Content กรอกเองทุกกิจกรรม

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `eventId` | String | `EV001` | รหัสกิจกรรม (ห้ามซ้ำ) |
| `eventDate` | Date | `2025-02-14` | วันที่จัดกิจกรรม (รูปแบบ YYYY-MM-DD) |
| `title` | String | `วันสถาปนาโรงเรียน` | ชื่อกิจกรรม |
| `description` | String | `พิธีทำบุญและกิจกรรม...` | รายละเอียดย่อ |
| `targetSegment` | String | `all` | all / teacher / student / parent |
| `notified` | Boolean | `FALSE` | ส่ง Push แจ้งเตือนแล้วหรือยัง |
| `createdAt` | DateTime | `2025-01-10` | วันที่สร้าง |

**ตัวอย่าง:**

| eventId | eventDate | title | description | targetSegment | notified | createdAt |
|---|---|---|---|---|---|---|
| EV001 | 2025-02-15 | วันสถาปนาโรงเรียน | พิธีทำบุญและกิจกรรมพิเศษ ณ ลานหน้าโรงเรียน | all | FALSE | 2025-01-10 |
| EV002 | 2025-03-01 | เปิดรับสมัครนักเรียนใหม่ | รับสมัครนักเรียน ม.1 และ ม.4 ปีการศึกษา 2569 | all | FALSE | 2025-01-10 |

---

### Sheet 9: `Bot_Config` ⭐ ตรวจสอบก่อน Launch

| key | value เริ่มต้น | คำอธิบาย | ปรับได้? |
|---|---|---|---|
| `RATE_LIMIT_PER_DAY` | `30` | คำถามสูงสุด/คน/วัน (registered) | ✅ |
| `VISITOR_QUESTION_LIMIT` | `5` | คำถามสูงสุด/คน/วัน (visitor) | ✅ |
| `LLM_MAX_TOKENS` | `500` | ขนาด response ของ LLM | ✅ |
| `LLM_TEMPERATURE` | `0.3` | ความสร้างสรรค์ของคำตอบ (0-1) | ✅ |
| `KB_CACHE_TTL` | `600` | วินาทีที่ Cache FAQ ไว้ | ✅ |
| `CONTACT_PHONE` | `034-109686` | เบอร์โทรโรงเรียน | ✅ |
| `CONTACT_EMAIL` | `satitdsu@su.ac.th` | อีเมลโรงเรียน | ✅ |
| `SCHOOL_HOURS` | `จ-ศ 08:00-16:30 น.` | เวลาทำการ | ✅ |
| `NEWS_SOURCE_URL` | `https://satit.su.ac.th` | URL ดึงข่าวโรงเรียน | ✅ |
| `NEWS_FETCH_COUNT` | `5` | จำนวนข่าวที่ดึงต่อครั้ง | ✅ |
| `NEWS_CACHE_HOURS` | `6` | ชั่วโมงที่ Cache ข่าวไว้ | ✅ |
| `VOTE_ALLOW_CHANGE` | `FALSE` | อนุญาตให้เปลี่ยนผลโหวตหรือไม่ | ✅ |

> **คำแนะนำ:** แก้ไข `NEWS_SOURCE_URL` ให้ตรงกับ URL จริงของเว็บไซต์โรงเรียนก่อน launch ค่ะ

---

### Sheet 10: `Poll_Master` — สร้าง Poll ใหม่

Admin สร้าง Poll ได้โดยตรงใน Sheet นี้

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `pollId` | String | `POLL001` | รหัส Poll (ห้ามซ้ำ) |
| `title` | String | `โหวตเมนูอาหาร` | หัวข้อ (แสดงใน Flex Card) |
| `description` | String | `เลือกเมนูที่ชอบ` | คำอธิบายเพิ่มเติม |
| `option1` | String | `ข้าวผัดกะเพรา` | ตัวเลือกที่ 1 (**ต้องมี**) |
| `option2` | String | `ข้าวมันไก่` | ตัวเลือกที่ 2 (**ต้องมี**) |
| `option3` | String | `ก๋วยเตี๋ยว` | ตัวเลือกที่ 3 (ว่างได้) |
| `option4` | String | *(ว่าง)* | ตัวเลือกที่ 4 (ว่างได้) |
| `targetSegment` | String | `student` | all / teacher / staff / student / parent |
| `startDate` | Date | `2025-01-10` | วันเริ่มต้น |
| `endDate` | Date | `2025-01-12` | วันหมดเขต |
| `status` | String | `active` | **`active`** (เปิด) / **`closed`** (ปิด) |
| `resultVisible` | Boolean | `TRUE` | ให้ผู้โหวตเห็นผลแบบ real-time |
| `createdBy` | String | `U1234...` | LINE User ID ของ Admin |
| `createdAt` | DateTime | `2025-01-10` | วันที่สร้าง |

**ตัวอย่าง Poll:**

| pollId | title | description | option1 | option2 | option3 | option4 | targetSegment | startDate | endDate | status | resultVisible |
|---|---|---|---|---|---|---|---|---|---|---|---|
| POLL001 | โหวตเมนูอาหารวันศุกร์ | เลือกเมนูที่น้องๆ อยากทาน | ข้าวผัดกะเพรา | ข้าวมันไก่ | ก๋วยเตี๋ยว | ข้าวหมูแดง | student | 2025-01-10 | 2025-01-12 | active | TRUE |
| POLL002 | ความพึงพอใจงานวันครู | ท่านพึงพอใจงานวันครูมากน้อยเพียงใด | พอใจมากที่สุด | พอใจมาก | พอใจ | ปรับปรุงได้ | all | 2025-01-16 | 2025-01-17 | active | FALSE |

> **การปิด Poll ก่อนกำหนด:** Admin สามารถกด "ปิด Poll" จาก Admin Panel ใน LINE OA ได้ หรือเปลี่ยน `status` เป็น `closed` ใน Sheet โดยตรง

---

### Sheet 11: `Poll_Votes`

ระบบบันทึกอัตโนมัติ — **Admin ดูได้อย่างเดียว ห้ามแก้ไข**

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `voteId` | String | `VOTE_POLL001_U1234_...` | รหัส (ระบบสร้าง) |
| `pollId` | String | `POLL001` | อ้างอิง Poll |
| `userId` | String | `U1234...` | LINE User ID ผู้โหวต |
| `segment` | String | `student` | segment ของผู้โหวต |
| `selectedOption` | Number | `1` | เลขตัวเลือกที่เลือก (1-4) |
| `votedAt` | DateTime | `2025-01-10 14:30` | เวลาที่โหวต |

> **หมายเหตุ:** ระบบตรวจสอบ `pollId + userId` เพื่อป้องกันการโหวตซ้ำ

---

### Sheet 12: `News_Feed_Cache`

ระบบอัปเดตอัตโนมัติเมื่อผู้ใช้ขอดูข่าว — Admin สามารถเพิ่มข่าวด้วยตนเองได้

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `newsId` | String | `NEWS001` | รหัสข่าว |
| `title` | String | `เปิดรับสมัครนักเรียนใหม่` | หัวข้อข่าว |
| `summary` | String | `โรงเรียนสาธิตฯ เปิดรับ...` | สรุปย่อ (ไม่เกิน 150 คำ) |
| `sourceUrl` | String | `https://satit.su.ac.th/...` | URL ต้นทาง |
| `publishedDate` | Date | `2025-01-10` | วันที่ข่าว |
| `fetchedAt` | DateTime | `2025-01-10 08:00` | วันที่ดึงข้อมูล |
| `active` | Boolean | `TRUE` | แสดงหรือไม่ |

> **การเพิ่มข่าวด้วยตนเอง:** เพิ่มแถวและตั้ง `active` เป็น `TRUE` ข่าวจะแสดงในระบบทันที
> **การซ่อนข่าว:** เปลี่ยน `active` เป็น `FALSE`

---

## 📣 DSU_Broadcast_DB

### Sheet 13: `Broadcast_Queue` — สร้าง Broadcast

Admin สร้าง Broadcast ใน Sheet นี้ จากนั้นใช้ LINE OA สั่ง Polish และ Send

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `broadcastId` | String | `BC001` | รหัส Broadcast (ห้ามซ้ำ) |
| `messageType` | String | `text` | `text` หรือ `flex` |
| `draft` | String | `ประกาศจากโรงเรียน...` | ร่างข้อความดิบ (Admin เขียน) |
| `polished` | String | *(ว่าง)* | ข้อความที่ผ่าน AI Polish แล้ว (ระบบกรอก) |
| `status` | String | `DRAFT` | DRAFT → POLISHED → CONFIRMED → SENT |
| `targetSegment` | String | `all` | all / teacher / staff / student / parent |
| `createdBy` | String | `Admin` | ชื่อผู้สร้าง |
| `createdAt` | DateTime | `2025-01-10` | วันที่สร้าง |
| `sentAt` | DateTime | *(ว่าง)* | วันที่ส่ง (ระบบกรอก) |
| `recipientCount` | Number | *(ว่าง)* | จำนวนผู้รับ (ระบบกรอก) |

**ขั้นตอน Broadcast Workflow:**

```
1. Admin กรอก draft ใน Sheet → status = DRAFT
2. ส่งข้อความ "BC001" ใน LINE OA → ป้าไพรแสดงปุ่ม [✨ Polish]
3. กด [Polish] → AI ปรับภาษา → status = POLISHED
4. ตรวจสอบข้อความใน Sheet → เปลี่ยน status = CONFIRMED ด้วยตนเอง
5. กด [ส่งเลย] ใน LINE OA → ระบบส่งถึงทุกคน → status = SENT
```

> **สำคัญ:** ต้องเปลี่ยน `status` เป็น `CONFIRMED` ด้วยตนเองก่อน กดส่ง เพื่อป้องกันการส่งโดยไม่ได้ตั้งใจ

---

### Sheet 14: `Push_Notifications` — สร้าง Push

| คอลัมน์ | ประเภท | ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| `pushId` | String | `PUSH001` | รหัส Push (ห้ามซ้ำ) |
| `message` | String | `⚠️ แจ้งหยุดเรียนพรุ่งนี้...` | ข้อความที่จะส่ง |
| `targetSegment` | String | `all` | all / teacher / staff / student / parent |
| `eventRef` | String | `EV001` | อ้างอิง Event (ถ้ามี, ว่างได้) |
| `status` | String | `PENDING` | PENDING / SENT |
| `sentBy` | String | `Admin` | ชื่อผู้สั่งส่ง |
| `sentAt` | DateTime | *(ว่าง)* | วันที่ส่ง (ระบบกรอก) |
| `recipientCount` | Number | *(ว่าง)* | จำนวนผู้รับ (ระบบกรอก) |

**ขั้นตอน Push Workflow:**

```
1. Admin กรอกข้อความและ targetSegment ใน Sheet → status = PENDING
2. พิมพ์ "PUSH001" ใน LINE OA → ป้าไพรแสดงปุ่ม [📣 ส่งแจ้งเตือน]
3. กด [ส่งแจ้งเตือน] → ระบบส่งทันที → status = SENT
```

> **ใช้ Push สำหรับ:** ข่าวด่วน, หยุดเรียนฉุกเฉิน, แจ้งกิจกรรมสำคัญ

---

## 🚀 Checklist ก่อน Launch

### Phase 1: ตั้งค่าระบบ
- [ ] สร้าง Google Spreadsheet 3 ไฟล์และคัดลอก ID
- [ ] กรอกข้อมูลทั้งหมดใน `quickSetup()` ใน Config.gs
- [ ] Run `quickSetup()` — ตรวจ Console ว่า ✅ ทุกขั้นตอน
- [ ] Deploy Web App (Execute as: Me, Who has access: Anyone)
- [ ] คัดลอก Web App URL ไปตั้งเป็น Webhook ใน LINE Developers Console
- [ ] เปิด Use Webhook ใน LINE Developers Console
- [ ] ปิด Auto-reply และ Greeting message ใน LINE Official Account Manager

### Phase 2: กรอกข้อมูล
- [ ] กรอกข้อมูลอาจารย์/บุคลากรทั้งหมดใน `Teacher_Registry` (DSU_Main_DB)
- [ ] กรอกข้อมูลนักเรียนทั้งหมดใน `Student_Registry` (DSU_Main_DB)
- [ ] ตรวจสอบและแก้ไข FAQ ใน `FAQ_Master` (DSU_Content_DB)
- [ ] แก้ไข `NEWS_SOURCE_URL` ใน `Bot_Config` ให้ถูกต้อง
- [ ] เพิ่มกิจกรรมที่กำลังจะมาใน `Event_Calendar`

### Phase 3: ทดสอบ
- [ ] Scan QR Code และ Add Friend LINE OA
- [ ] ทดสอบ Segment Selection (Teacher / Student / Parent)
- [ ] ทดสอบ Registration Flow ครบทั้ง 3 ประเภท
- [ ] ทดสอบถาม FAQ อย่างน้อย 5 คำถาม
- [ ] ทดสอบ Visitor Rate Limit (ถาม 5 ครั้ง → ต้องบล็อก)
- [ ] ทดสอบ Voting System (สร้าง Poll → โหวต → ดูผล)
- [ ] ทดสอบ News Feed
- [ ] ทดสอบ Events
- [ ] ทดสอบ Admin Panel (Broadcast, Push, Poll, Stats)
- [ ] Run `systemHealthCheck()` ใน Apps Script → ✅ ทุกรายการ

### Phase 4: Upload Rich Menu Images
- [ ] ออกแบบภาพ Rich Menu (2500 × 843 px) สำหรับแต่ละ segment
- [ ] อัปโหลดภาพจริงผ่าน LINE Developers Console หรือ API
- [ ] ตรวจสอบว่า Rich Menu แสดงถูกต้องในแต่ละ segment

---

## 📋 PropertiesService Keys Summary

| Key | ตั้งค่าที่ไหน | คำอธิบาย |
|---|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | quickSetup() | Token จาก LINE Developers Console |
| `LINE_CHANNEL_SECRET` | quickSetup() | Secret จาก LINE Developers Console |
| `API_KEY` | quickSetup() | OpenAI API Key หรือ Compatible API |
| `AI_ENDPOINT` | quickSetup() | Endpoint URL (default: OpenAI) |
| `AI_MODEL` | quickSetup() | ชื่อ Model (default: gpt-4o-mini) |
| `SPREADSHEET_MAIN_ID` | quickSetup() | ID ของ DSU_Main_DB |
| `SPREADSHEET_CONTENT_ID` | quickSetup() | ID ของ DSU_Content_DB |
| `SPREADSHEET_BROADCAST_ID` | quickSetup() | ID ของ DSU_Broadcast_DB |
| `SUPER_ADMIN_USER_ID` | quickSetup() | LINE User ID ของ Super Admin |
| `ADMIN_USER_IDS` | quickSetup() | JSON array ของ Admin IDs |
| `RICH_MENU_ID_VISITOR` | setupRichMenus() | สร้างอัตโนมัติ |
| `RICH_MENU_ID_MEMBER` | setupRichMenus() | สร้างอัตโนมัติ |
| `RICH_MENU_ID_STUDENT` | setupRichMenus() | สร้างอัตโนมัติ |

---

## ❓ คำถามที่พบบ่อย

**Q: ถ้า Rich Menu ภาพ placeholder ไม่แสดง ต้องทำอย่างไร?**
A: เข้า LINE Developers Console → เลือก Messaging API → Rich menu → อัปโหลดภาพจริงให้แต่ละ Rich Menu ค่ะ

**Q: อาจารย์ลงทะเบียนแล้วต้องการเปลี่ยนข้อมูล ทำอย่างไร?**
A: Admin ล้าง `userId` ใน Teacher_Registry ออก และล้าง `segment` ใน User_Profiles เป็น `visitor` จากนั้นอาจารย์ลงทะเบียนใหม่ได้ค่ะ

**Q: ต้องการเพิ่ม FAQ ใหม่โดยไม่ต้อง Redeploy ได้ไหม?**
A: ได้เลยค่ะ เพิ่มแถวใน `FAQ_Master` และตั้ง `active = TRUE` — ระบบจะดึงข้อมูลใหม่ภายใน 10 นาที (ตาม Cache TTL)

**Q: ต้องการให้ Visitor ถามได้มากขึ้น ปรับได้ที่ไหน?**
A: แก้ไขค่า `VISITOR_QUESTION_LIMIT` ใน Sheet `Bot_Config` (DSU_Content_DB) ได้เลยค่ะ ไม่ต้อง Redeploy

**Q: ต้องการ Switch AI Provider เป็น DeepSeek ทำอย่างไร?**
A: เรียก `setProp('AI_ENDPOINT', 'https://api.deepseek.com/v1/chat/completions')` และ `setProp('AI_MODEL', 'deepseek-chat')` ใน Apps Script Console ค่ะ

---

*คู่มือนี้จัดทำโดย PAPRAI Platform — โรงเรียนสาธิต มหาวิทยาลัยศิลปากร (มัธยมศึกษา)*
*Version 2.0.0 | ฝ่ายวิชาการและนวัตกรรมการเรียนรู้*
