-- MOUAU FreshStart Schema v3
-- Run in Supabase SQL Editor

SET search_path TO public;

-- ===== Chat sessions table =====
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT        NOT NULL,
  title      TEXT        DEFAULT 'New Chat',
  messages   JSONB       DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_chat_sessions" ON public.chat_sessions;
CREATE POLICY "public_all_chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);

-- ===== Seed all MOUAU colleges and facilities =====
INSERT INTO public.campus_locations (name, description, lat, lng, category, hours, directions, sort_order) VALUES
  ('CAERSE','College of Agricultural Economics, Rural Sociology & Extension. Departments: Agribusiness & Management, Agricultural Economics, Agricultural Extension & Rural Sociology.',5.4792,7.5448,'academic','Mon-Fri 8AM-5PM','Located in the main academic zone. Ask any staff member for directions to CAERSE.',11),
  ('CASAP','College of Animal Science & Animal Production. Departments: Animal Breeding & Physiology, Animal Nutrition & Forage Science, Animal Production & Livestock Management.',5.4788,7.5462,'academic','Mon-Fri 8AM-5PM','Located near the agricultural area of campus.',12),
  ('CAFST','College of Applied Food Science & Tourism. Departments: Human Nutrition & Dietetics, Home Science/Hospitality Management & Tourism, Food Science & Technology.',5.4784,7.5458,'academic','Mon-Fri 8AM-5PM','In the central academic block area.',13),
  ('CCSS','College of Crop & Soil Sciences. Departments: Agronomy, Plant Health Management, Soil Science & Meteorology, Water Resources Management & Agrometeorology.',5.4796,7.5468,'academic','Mon-Fri 8AM-5PM','Near the College of Agriculture area, towards the eastern side.',14),
  ('CEET','College of Engineering & Engineering Technology. Departments: Agricultural & Bioresources Engineering, Civil Engineering, Chemical Engineering, Computer Engineering, Electrical Engineering, Mechanical Engineering.',5.4802,7.5472,'academic','Mon-Fri 8AM-5PM','Located in the engineering block. Follow signs from the main road.',15),
  ('COED','College of Education. Departments: Adult & Continuing Education, Agricultural/Home Science Education, Business Education, Economics Education, Education Management, Industrial Technology Education.',5.4778,7.5450,'academic','Mon-Fri 8AM-5PM','Located in the southern academic zone near the library.',16),
  ('COLMAS','College of Management Science. Departments: Marketing, Accounting, Banking & Finance, Economics, Industrial Relations & Personnel Management, Entrepreneurial Studies, Business Administration.',5.4782,7.5455,'academic','Mon-Fri 8AM-5PM','Near the admin block, on the left side coming from the main gate.',17),
  ('CNREM','College of Natural Resources & Environmental Management. Departments: Environment Management & Toxicology, Fisheries & Aquatic Resources Management, Forestry & Environmental Management.',5.4775,7.5442,'academic','Mon-Fri 8AM-5PM','Houses the FOREM library, science laboratory, and herbarium. Located in the southern campus area.',18),
  ('COLNAS','College of Natural Science. Departments: Biochemistry, Microbiology, Plant Science & Biotechnology, Zoology & Environmental Biology.',5.4790,7.5460,'academic','Mon-Fri 8AM-5PM','In the central academic zone next to the main library.',19),
  ('COLPAS','College of Physical & Applied Science. Departments: Chemistry, Computer Science, Geology, Mathematics, Physics, Statistics.',5.4787,7.5458,'academic','Mon-Fri 8AM-5PM','Adjacent to COLNAS in the central academic zone.',20),
  ('CVM','College of Veterinary Medicine. Departments: Theriogenology, Veterinary Anatomy, Veterinary Medicine, Veterinary Microbiology, Veterinary Public Health, Veterinary Surgery & Radiology.',5.4804,7.5465,'academic','Mon-Fri 8AM-5PM','Located in the veterinary complex at the northern part of campus.',21),
  ('School of General Studies (SGS)','Handles general courses: English, French, German, History, Social Science, Physical & Health Education, Philosophy, and Peace & Conflict Studies.',5.4781,7.5447,'academic','Mon-Fri 8AM-5PM','Situated near the admin block.',22),
  ('Anyim Pius Auditorium','Major event and gathering hall. Used for matriculation, convocation, and large university events. Also known as the School Portal.',5.4797,7.5451,'social','Event days only','From the main gate, go straight and turn left at the admin block. The auditorium is ahead on your right.',23),
  ('Old Matric Ground','Located opposite the Anyim Pius Auditorium. Used for university ceremonies.',5.4799,7.5449,'social','Event days only','Directly opposite the Anyim Pius Auditorium.',24),
  ('CNREM Complex','Houses the FOREM library, science laboratory, herbarium, and CNREM departmental offices.',5.4774,7.5443,'academic','Mon-Fri 9AM-5PM','In the southern academic area. Follow signs for CNREM from the main road.',25),
  ('First Bank Building','Financial services on campus. Located near the Wood Science and Technology Workshop.',5.4795,7.5453,'admin','Mon-Fri 8AM-4PM','Near the admin block, beside the Wood Science workshop.',26),
  ('MOUAU Fish Farm','University fish farm for research and practical training in aquatic resources.',5.4765,7.5470,'academic','Mon-Fri 8AM-4PM','Located at the far end of the campus, past the sports complex.',27),
  ('Relic Forest','An 80-year-old forest used for outdoor ecological studies and biodiversity research.',5.4760,7.5460,'academic','Mon-Fri 8AM-5PM','At the outer edge of campus near CNREM. Ask the CNREM office for a guide.',28),
  ('Centre for Entrepreneurship Development','Provides entrepreneurship training and support for students and staff.',5.4783,7.5448,'academic','Mon-Fri 9AM-4PM','Located near the admin block area.',29),
  ('ICT Centre','Information and Communication Technology Centre. Handles student portal issues and computer lab access.',5.4793,7.5445,'academic','Mon-Fri 8AM-5PM','Behind the admin block, follow the signs.',30)
ON CONFLICT DO NOTHING;

-- ===== Seed AI training with full MOUAU knowledge =====
INSERT INTO public.ai_training (question, answer, category, active) VALUES
  ('What colleges are in MOUAU?','MOUAU has 11 colleges and 1 school: CAERSE (Agricultural Economics), CASAP (Animal Science), CAFST (Applied Food Science & Tourism), CCSS (Crop & Soil Sciences), CEET (Engineering), COED (Education), COLMAS (Management Science), CNREM (Natural Resources), COLNAS (Natural Science), COLPAS (Physical & Applied Science), CVM (Veterinary Medicine), and the School of General Studies (SGS).','colleges',true),
  ('What is CAERSE?','CAERSE stands for College of Agricultural Economics, Rural Sociology & Extension. Its departments are Agribusiness & Management, Agricultural Economics, and Agricultural Extension & Rural Sociology.','colleges',true),
  ('What is CASAP?','CASAP is the College of Animal Science & Animal Production. Departments: Animal Breeding & Physiology, Animal Nutrition & Forage Science, and Animal Production & Livestock Management.','colleges',true),
  ('What is CAFST?','CAFST is the College of Applied Food Science & Tourism. Departments: Human Nutrition & Dietetics, Home Science/Hospitality Management & Tourism, and Food Science & Technology.','colleges',true),
  ('What is CCSS?','CCSS is the College of Crop & Soil Sciences. Departments: Agronomy, Plant Health Management, Soil Science & Meteorology, and Water Resources Management & Agrometeorology.','colleges',true),
  ('What is CEET?','CEET is the College of Engineering & Engineering Technology. Departments: Agricultural & Bioresources Engineering, Civil Engineering, Chemical Engineering, Computer Engineering, Electrical & Electronics Engineering, and Mechanical Engineering.','colleges',true),
  ('What is COLNAS?','COLNAS is the College of Natural Science. Departments: Biochemistry, Microbiology, Plant Science & Biotechnology, and Zoology & Environmental Biology.','colleges',true),
  ('What is COLPAS?','COLPAS is the College of Physical & Applied Science. Departments: Chemistry, Computer Science, Geology, Mathematics, Physics, and Statistics.','colleges',true),
  ('What is CVM?','CVM is the College of Veterinary Medicine. Departments: Theriogenology, Veterinary Anatomy, Veterinary Medicine, Veterinary Microbiology, Veterinary Public Health & Preventive Medicine, and Veterinary Surgery & Radiology.','colleges',true),
  ('What is COLMAS?','COLMAS is the College of Management Science. Departments: Marketing, Accounting, Banking & Finance, Economics, Industrial Relations & Personnel Management, Entrepreneurial Studies, and Business Administration.','colleges',true),
  ('What is CNREM?','CNREM is the College of Natural Resources & Environmental Management. Departments: Environment Management & Toxicology, Fisheries & Aquatic Resources Management, and Forestry & Environmental Management. The CNREM Complex houses the FOREM library, science laboratory, herbarium, and departmental offices.','colleges',true),
  ('What is COED?','COED is the College of Education. Departments include: Adult & Continuing Education, Agricultural/Home Science Education, Business Education, Economics Education, Education Management, Industrial Technology Education, Library & Information Science, Guidance & Counselling, and Integrated Science Education.','colleges',true),
  ('What is SGS?','SGS is the School of General Studies. It handles general university courses like English, French, German, History, Social Science, Physical & Health Education, Philosophy, and Peace & Conflict Studies.','colleges',true),
  ('Where is MOUAU located?','MOUAU is located in Umudike, Abia State, Nigeria, about 9 to 10 kilometers east of Umuahia along the Umuahia-Ikot Ekpene Federal Road. The university also has land in Uzuakoli, Olokoro, and Ibeku.','general',true),
  ('What is the Anyim Pius Auditorium?','The Anyim Pius Auditorium (also called the School Portal) is a major event and gathering hall at MOUAU used for matriculation, convocation ceremonies, and other large university events. It is located near the admin block.','facilities',true),
  ('Where is the ICT Centre?','The ICT Centre is located behind the Administrative Block. Visit for student portal login issues, computer lab access, and technical support. Contact: +234 902 434 8507.','facilities',true),
  ('What is the Relic Forest?','The Relic Forest is an 80-year-old forest on the MOUAU campus used for outdoor ecological studies and biodiversity research. It is managed by CNREM and located at the outer edge of campus.','facilities',true)
ON CONFLICT DO NOTHING;
