export type LibraryItem = {
  id: string
  title: string
  department: string
  college: string
  level: string
  type: 'handout' | 'past-question' | 'note' | 'textbook'
  course: string
  courseCode: string
  uploader: string
  year?: string
  downloads: number
  rating: number
  size: string
  uploadedAt: string
  verified: boolean
}

export type ForumPost = {
  id: string
  title: string
  body: string
  author: string
  avatar: string
  category: string
  replies: number
  views: number
  likes: number
  time: string
  answered: boolean
  tags: string[]
}

export type Announcement = {
  id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'event'
  date: string
  pinned: boolean
}

export type CampusLocation = {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  category: 'academic' | 'admin' | 'hostel' | 'social' | 'health' | 'worship' | 'sport'
  hours?: string
}

export const COLLEGES = [
  'College of Agriculture',
  'College of Natural Sciences',
  'College of Engineering & Engineering Technology',
  'College of Food & Nutrition Sciences',
  'College of Veterinary Medicine',
  'College of Management Sciences',
  'School of Postgraduate Studies'
]

export const DEPARTMENTS: Record<string, string[]> = {
  'College of Agriculture': ['Agronomy', 'Crop Science & Technology', 'Agricultural Extension', 'Soil Science', 'Animal Science'],
  'College of Natural Sciences': ['Biochemistry', 'Computer Science', 'Microbiology', 'Chemistry', 'Mathematics', 'Physics'],
  'College of Engineering & Engineering Technology': ['Agricultural Engineering', 'Food Engineering', 'Electrical Engineering', 'Civil Engineering'],
  'College of Food & Nutrition Sciences': ['Food Science & Technology', 'Human Nutrition & Dietetics', 'Food Processing Technology'],
  'College of Veterinary Medicine': ['Veterinary Surgery', 'Veterinary Medicine', 'Veterinary Physiology'],
  'College of Management Sciences': ['Agricultural Economics', 'Business Administration', 'Accounting', 'Economics']
}

export const LIBRARY_ITEMS: LibraryItem[] = [
  { id:'1', title:'Introduction to Agronomy - Complete Handout', department:'Agronomy', college:'College of Agriculture', level:'100', type:'handout', course:'Principles of Agronomy', courseCode:'AGR 101', uploader:'Dr. Okonkwo', downloads:342, rating:4.8, size:'2.4 MB', uploadedAt:'2024-01-15', verified:true, year:undefined },
  { id:'2', title:'AGR 101 Past Questions 2019-2023', department:'Agronomy', college:'College of Agriculture', level:'100', type:'past-question', course:'Principles of Agronomy', courseCode:'AGR 101', uploader:'Chukwuemeka O.', downloads:891, rating:4.9, size:'1.2 MB', uploadedAt:'2024-02-01', verified:true, year:'2019-2023' },
  { id:'3', title:'Biochemistry Lecture Notes - Metabolism', department:'Biochemistry', college:'College of Natural Sciences', level:'200', type:'note', course:'Intermediary Metabolism', courseCode:'BCH 201', uploader:'Dr. Eze', downloads:567, rating:4.7, size:'3.1 MB', uploadedAt:'2024-01-20', verified:true, year:undefined },
  { id:'4', title:'BCH 301 Past Questions 2020-2024', department:'Biochemistry', college:'College of Natural Sciences', level:'300', type:'past-question', course:'Enzyme Kinetics', courseCode:'BCH 301', uploader:'Adaeze N.', downloads:423, rating:4.6, size:'890 KB', uploadedAt:'2024-03-10', verified:false, year:'2020-2024' },
  { id:'5', title:'Computer Science - Data Structures & Algorithms', department:'Computer Science', college:'College of Natural Sciences', level:'200', type:'handout', course:'Data Structures', courseCode:'CSC 202', uploader:'Dr. Nwachukwu', downloads:789, rating:4.9, size:'4.2 MB', uploadedAt:'2024-01-08', verified:true, year:undefined },
  { id:'6', title:'CSC 101 Past Questions 2018-2023', department:'Computer Science', college:'College of Natural Sciences', level:'100', type:'past-question', course:'Introduction to Computing', courseCode:'CSC 101', uploader:'Kelechi A.', downloads:1203, rating:4.8, size:'2.1 MB', uploadedAt:'2024-02-14', verified:true, year:'2018-2023' },
  { id:'7', title:'Food Science - Food Chemistry Textbook (Chapters 1-8)', department:'Food Science & Technology', college:'College of Food & Nutrition Sciences', level:'200', type:'textbook', course:'Food Chemistry', courseCode:'FST 201', uploader:'Dr. Obi', downloads:234, rating:4.5, size:'8.7 MB', uploadedAt:'2024-01-25', verified:true, year:undefined },
  { id:'8', title:'Microbiology - Medical Microbiology Notes', department:'Microbiology', college:'College of Natural Sciences', level:'300', type:'note', course:'Medical Microbiology', courseCode:'MCB 302', uploader:'Ifeoma C.', downloads:456, rating:4.4, size:'2.8 MB', uploadedAt:'2024-03-05', verified:false, year:undefined },
  { id:'9', title:'Agricultural Economics Past Questions 2021-2024', department:'Agricultural Economics', college:'College of Management Sciences', level:'200', type:'past-question', course:'Farm Management', courseCode:'AEC 201', uploader:'Obinna E.', downloads:312, rating:4.3, size:'1.5 MB', uploadedAt:'2024-02-28', verified:true, year:'2021-2024' },
  { id:'10', title:'Animal Science - Livestock Production Handbook', department:'Animal Science', college:'College of Agriculture', level:'300', type:'handout', course:'Livestock Production', courseCode:'ANS 301', uploader:'Dr. Ugwu', downloads:198, rating:4.6, size:'5.3 MB', uploadedAt:'2024-01-30', verified:true, year:undefined },
  { id:'11', title:'Soil Science - Soil Fertility & Management Notes', department:'Soil Science', college:'College of Agriculture', level:'200', type:'note', course:'Soil Fertility', courseCode:'SSL 201', uploader:'Chidinma O.', downloads:267, rating:4.5, size:'3.4 MB', uploadedAt:'2024-03-15', verified:false, year:undefined },
  { id:'12', title:'General Chemistry 100L Handout (Full)', department:'Chemistry', college:'College of Natural Sciences', level:'100', type:'handout', course:'General Chemistry', courseCode:'CHM 101', uploader:'Dr. Nnadi', downloads:1456, rating:4.9, size:'6.1 MB', uploadedAt:'2024-01-05', verified:true, year:undefined },
  { id:'13', title:'CHM 101 Past Questions 2017-2024 (Compiled)', department:'Chemistry', college:'College of Natural Sciences', level:'100', type:'past-question', course:'General Chemistry', courseCode:'CHM 101', uploader:'Amaka J.', downloads:2134, rating:5.0, size:'3.2 MB', uploadedAt:'2024-02-20', verified:true, year:'2017-2024' },
  { id:'14', title:'Engineering Mathematics - Complete Notes', department:'Agricultural Engineering', college:'College of Engineering & Engineering Technology', level:'100', type:'note', course:'Engineering Mathematics', courseCode:'ENG 101', uploader:'Dr. Okeke', downloads:678, rating:4.7, size:'4.8 MB', uploadedAt:'2024-01-12', verified:true, year:undefined },
  { id:'15', title:'Veterinary Anatomy Past Questions 2020-2023', department:'Veterinary Surgery', college:'College of Veterinary Medicine', level:'200', type:'past-question', course:'Veterinary Anatomy', courseCode:'VET 201', uploader:'Uchenna M.', downloads:145, rating:4.2, size:'1.8 MB', uploadedAt:'2024-03-01', verified:false, year:'2020-2023' },
]

export const FORUM_POSTS: ForumPost[] = [
  { id:'1', title:'How do I check my JAMB admission status on MOUAU portal?', body:'I just got my JAMB result and I was told to check my admission status. Can someone guide me on how to do this step by step?', author:'NewFresher2024', avatar:'NF', category:'Admissions', replies:12, views:456, likes:34, time:'2 hours ago', answered:true, tags:['JAMB','admission','portal'] },
  { id:'2', title:'Where exactly is the Agronomy Department office?', body:'I need to submit my departmental clearance form but I cannot find the office. Is it in the main academic area or somewhere else?', author:'AgroStudent', avatar:'AS', category:'Navigation', replies:8, views:234, likes:18, time:'5 hours ago', answered:true, tags:['agronomy','office','clearance'] },
  { id:'3', title:'Best affordable hostels near MOUAU for freshers?', body:'I am looking for off-campus accommodation. Which ones are safe, affordable, and close to school? I prefer something with good internet.', author:'FreshFresh2024', avatar:'FF', category:'Accommodation', replies:23, views:891, likes:67, time:'1 day ago', answered:false, tags:['hostel','accommodation','freshers'] },
  { id:'4', title:'CSC 101 exam tips and past questions compilation', body:'Hey guys, I compiled all the past questions I could find for CSC 101. The pattern shows questions mostly come from chapters 3, 5 and 8. Here are the key topics...', author:'TechGuru_MOUAU', avatar:'TG', category:'Study Help', replies:45, views:1234, likes:156, time:'2 days ago', answered:true, tags:['CSC','exam','past-questions'] },
  { id:'5', title:'How to register courses on MOUAU student portal?', body:'I logged in to the portal but I cannot find where to register my courses. My matric number is correct but the system says "registration closed". What do I do?', author:'ConfusedFresher', avatar:'CF', category:'Registration', replies:19, views:678, likes:42, time:'3 days ago', answered:true, tags:['portal','registration','courses'] },
  { id:'6', title:'Is there WiFi on campus? Which spots have the best connection?', body:'Coming from a school that had no internet. Does MOUAU have campus WiFi? Where are the best spots to connect?', author:'InternetAddict', avatar:'IA', category:'Campus Life', replies:31, views:567, likes:89, time:'4 days ago', answered:true, tags:['wifi','internet','campus'] },
  { id:'7', title:'MOUAU school fees payment - which bank and how?', body:'I need to pay my school fees. Someone said use Remita. How exactly do I generate the RRR? Do I need to visit the school first?', author:'PaymentConfused', avatar:'PC', category:'Finance', replies:14, views:432, likes:29, time:'5 days ago', answered:true, tags:['fees','payment','remita'] },
  { id:'8', title:'Looking for 200L Agricultural Economics textbooks', body:'Anyone has the recommended textbooks for AEC 201 and AEC 202? Preferably soft copies. The bookshop edition is too expensive.', author:'AgroEconStudent', avatar:'AE', category:'Study Help', replies:7, views:198, likes:12, time:'1 week ago', answered:false, tags:['textbook','agricultural-economics','200L'] },
]

export const ANNOUNCEMENTS: Announcement[] = [
  { id:'1', title:'Fresh Student Registration Deadline Extended', body:'The deadline for fresh student registration has been extended to March 31st, 2025. All freshers who have not completed their registration should do so immediately to avoid late registration charges.', type:'warning', date:'Mar 15, 2025', pinned:true },
  { id:'2', title:'Welcome to MOUAU - Orientation Programme', body:'The orientation programme for the 2024/2025 session fresh students will hold from Monday 17th to Friday 21st March, 2025 at the Convocation Arena. Attendance is compulsory for all freshers.', type:'event', date:'Mar 12, 2025', pinned:true },
  { id:'3', title:'Library Now Open on Saturdays', body:'The University Library has extended its opening hours to include Saturdays (9AM - 4PM) to accommodate students preparing for examinations. Access requires a valid student ID.', type:'success', date:'Mar 10, 2025', pinned:false },
  { id:'4', title:'MOUAU Tech Hub Grand Opening', body:"The university's new Technology Hub is now open to all students. The hub features high-speed internet, computer workstations, and collaborative workspaces. Visit the hub at the College of Natural Sciences building.", type:'info', date:'Mar 8, 2025', pinned:false },
  { id:'5', title:'Course Registration Portal Open', body:'The portal for course registration for the 2024/2025 second semester is now open. Students are advised to register their courses before the deadline to avoid any complications with their academic records.', type:'info', date:'Mar 5, 2025', pinned:false },
]

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { id:'1', name:'Main Gate', description:'Primary entrance to the university. Security checkpoints here. Open 24 hours.', lat:5.4820, lng:7.5465, category:'admin', hours:'24/7' },
  { id:'2', name:'Administrative Block', description:'Vice Chancellor office, Registrar, Bursary, and main admin offices.', lat:5.4800, lng:7.5440, category:'admin', hours:'Mon-Fri 8AM-4PM' },
  { id:'3', name:'University Library', description:'Main library with over 50,000 volumes. Computer lab, reading rooms, and digital resources.', lat:5.4780, lng:7.5435, category:'academic', hours:'Mon-Fri 9AM-6PM, Sat 9AM-4PM' },
  { id:'4', name:'College of Agriculture', description:'Agronomy, Crop Science, Animal Science, Soil Science, and Agricultural Extension departments.', lat:5.4795, lng:7.5470, category:'academic', hours:'Mon-Fri 8AM-5PM' },
  { id:'5', name:'College of Natural Sciences', description:'Biochemistry, Computer Science, Microbiology, Chemistry, Mathematics and Physics departments.', lat:5.4790, lng:7.5460, category:'academic', hours:'Mon-Fri 8AM-5PM' },
  { id:'6', name:'College of Engineering', description:'Agricultural Engineering, Food Engineering, Electrical and Civil Engineering departments.', lat:5.4775, lng:7.5475, category:'academic', hours:'Mon-Fri 8AM-5PM' },
  { id:'7', name:'College of Food Sciences', description:'Food Science & Technology and Human Nutrition departments. Well-equipped food labs.', lat:5.4785, lng:7.5455, category:'academic', hours:'Mon-Fri 8AM-5PM' },
  { id:'8', name:'College of Veterinary Medicine', description:'Veterinary hospital and departments. Teaching hospital attached.', lat:5.4810, lng:7.5480, category:'academic', hours:'Mon-Sat 8AM-5PM' },
  { id:'9', name:'Student Union Building (SUB)', description:'Student union offices, event hall, and student lounge. Social hub of the campus.', lat:5.4785, lng:7.5450, category:'social', hours:'Mon-Sat 8AM-10PM' },
  { id:'10', name:"University Health Centre", description:'First aid, clinic, and basic medical services. 24-hour emergency care available.', lat:5.4793, lng:7.5442, category:'health', hours:'24/7 Emergency, Mon-Fri 8AM-6PM' },
  { id:'11', name:'University Cafeteria / Eatery', description:'Main student cafeteria. Affordable meals for students and staff. Multiple food stalls.', lat:5.4788, lng:7.5452, category:'social', hours:'Mon-Sat 7AM-9PM' },
  { id:'12', name:'Sports Complex', description:'Football field, basketball court, tennis court, and gymnasium.', lat:5.4770, lng:7.5465, category:'sport', hours:'Mon-Sat 6AM-8PM' },
  { id:'13', name:'University Chapel', description:'Interdenominational chapel for Christian students. Services on Sundays.', lat:5.4782, lng:7.5468, category:'worship', hours:'Sun 8AM-12PM, Mon-Fri 6AM-7AM' },
  { id:'14', name:'University Mosque', description:'Mosque for Muslim students and staff. Friday Jumat prayers.', lat:5.4798, lng:7.5435, category:'worship', hours:'Daily prayer times' },
  { id:'15', name:'Male Hostel Area', description:'University male student hostels. Contact Hostel Warden for allocation.', lat:5.4815, lng:7.5445, category:'hostel', hours:'24/7' },
  { id:'16', name:'Female Hostel Area', description:'University female student hostels. Secure and monitored access.', lat:5.4820, lng:7.5430, category:'hostel', hours:'24/7' },
  { id:'17', name:'MOUAU Portal / ICT Centre', description:'Student portal access, ICT services, internet cafe, and tech support.', lat:5.4789, lng:7.5421, category:'academic', hours:'Mon-Fri 8AM-4PM' },
  { id:'18', name:'Senate Building / Convocation Arena', description:'Senate chambers and convocation ground. Used for major university ceremonies.', lat:5.4808, lng:7.5458, category:'admin', hours:'By schedule' },
]

export const REGISTRATION_STEPS = [
  {
    id: '1',
    title: 'JAMB Admission Verification',
    description: 'Confirm your admission on the JAMB portal and MOUAU portal',
    substeps: [
      { id:'1a', text:'Visit jamb.gov.ng and verify your admission status' },
      { id:'1b', text:'Visit mouau.edu.ng and check the admission list' },
      { id:'1c', text:'Print your admission letter from the JAMB CAPS portal' }
    ]
  },
  {
    id: '2',
    title: 'Acceptance Fee Payment',
    description: 'Pay the acceptance fee through the school portal',
    substeps: [
      { id:'2a', text:'Log in to the MOUAU student portal at mouau.edu.ng' },
      { id:'2b', text:'Generate your Remita Retrieval Reference (RRR) number' },
      { id:'2c', text:'Visit any bank or pay online with the RRR number' },
      { id:'2d', text:'Upload payment receipt on the portal' }
    ]
  },
  {
    id: '3',
    title: 'School Fees Payment',
    description: 'Pay the full tuition and other levies',
    substeps: [
      { id:'3a', text:'Log in to the student portal and navigate to "Fee Payment"' },
      { id:'3b', text:'Generate RRR for school fees (tuition + accommodation + other levies)' },
      { id:'3c', text:'Pay at any bank or via internet banking' },
      { id:'3d', text:'Confirm payment on the portal and print receipt' }
    ]
  },
  {
    id: '4',
    title: 'Portal Registration & Profile Setup',
    description: 'Set up your student profile on the MOUAU portal',
    substeps: [
      { id:'4a', text:'Log in with your JAMB number and default password' },
      { id:'4b', text:'Upload a recent passport photograph' },
      { id:'4c', text:'Fill in your personal information and next-of-kin details' },
      { id:'4d', text:'Update your contact information and local address' }
    ]
  },
  {
    id: '5',
    title: 'Course Registration',
    description: 'Register your courses for the current semester',
    substeps: [
      { id:'5a', text:'Navigate to "Course Registration" on the portal' },
      { id:'5b', text:'Select your 100 Level first semester courses' },
      { id:'5c', text:'Ensure total units fall within approved minimum and maximum' },
      { id:'5d', text:'Submit and print your course registration form' }
    ]
  },
  {
    id: '6',
    title: 'Departmental Clearance',
    description: 'Visit your department for physical clearance',
    substeps: [
      { id:'6a', text:'Bring WAEC/NECO/NABTEB result (original + photocopy)' },
      { id:'6b', text:'Bring JAMB result and admission letter' },
      { id:'6c', text:'Bring your payment receipts (acceptance + school fees)' },
      { id:'6d', text:'Get your departmental clearance form signed by the HOD' }
    ]
  },
  {
    id: '7',
    title: 'Library Registration',
    description: 'Register for university library access',
    substeps: [
      { id:'7a', text:'Visit the university library with your student ID' },
      { id:'7b', text:'Fill out the library registration form' },
      { id:'7c', text:'Get your library card issued' }
    ]
  },
  {
    id: '8',
    title: 'Student ID Card Collection',
    description: 'Collect your official MOUAU student ID card',
    substeps: [
      { id:'8a', text:'Check the ICT Centre for ID card collection schedule' },
      { id:'8b', text:'Present your portal profile and clearance forms' },
      { id:'8c', text:'Collect and verify your student ID card details' }
    ]
  }
]

export const QUICK_FACTS = [
  'MOUAU was established in 1992 and is one of Nigeria\'s leading agricultural universities.',
  'The university is located in Umudike, about 8km from Umuahia, the Abia State capital.',
  'MOUAU has over 10 colleges offering undergraduate and postgraduate programs.',
  'The university library holds over 50,000 volumes and thousands of e-books.',
  'MOUAU has a dedicated Technology Hub with free high-speed internet for students.',
  'The student population is over 15,000 from across Nigeria and beyond.',
  'MOUAU runs both a first-semester and second-semester academic calendar.',
  'Portal login uses your JAMB number as default username for fresh students.',
  'The school clinic offers 24-hour emergency services for students.',
  'The university chapel holds interdenominational services every Sunday.',
]
