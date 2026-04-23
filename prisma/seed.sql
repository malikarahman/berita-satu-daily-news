TRUNCATE TABLE "activity_logs", "articles", "users", "system_logs" RESTART IDENTITY CASCADE;

INSERT INTO "users" ("name", "role", "email")
VALUES
  ('Editor Piket', 'Editor', 'editor.piket@beritasatu.internal'),
  ('Dina Pramesti', 'Lead Editor', 'dina.pramesti@beritasatu.internal'),
  ('Raka Mahendra', 'Editor', 'raka.mahendra@beritasatu.internal'),
  ('Maya Sari', 'Editor', 'maya.sari@beritasatu.internal');

INSERT INTO "articles" (
  "source_name",
  "source_url",
  "category",
  "location",
  "date",
  "day_name",
  "title",
  "preview_text",
  "body_text",
  "weather_payload_json",
  "draft_url",
  "run_type",
  "triggered_by",
  "generation_time",
  "requested_publish_datetime",
  "status",
  "editor_name",
  "notes",
  "created_at",
  "updated_at"
)
VALUES
(
  'BMKG',
  'https://cuaca.bmkg.go.id/',
  'Cuaca',
  'Jakarta',
  '2026-04-22T00:00:00.000Z',
  'Rabu',
  '[CUACA] Jakarta - Rabu, 22 April 2026',
  'Kondisi cuaca di Jakarta diperkirakan berawan pada sebagian besar waktu dengan suhu 24 hingga 31 derajat Celsius.',
  $$Jakarta, Beritasatu.com – Kondisi cuaca di wilayah Jakarta pada hari ini, Rabu, 22 April 2026, umumnya akan berawan. Perubahan cuaca pada beberapa periode hari tetap perlu diperhatikan.

Berdasarkan data Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), suhu udara di Jakarta pada hari ini berkisar antara 24 hingga 31 derajat Celsius dengan kelembapan 67 hingga 94 persen.

Di wilayah Jakarta Pusat dan Jakarta Timur, pada pagi hari berawan, pada siang hari berawan tebal, sore hari hujan ringan, dan malam hari kembali berawan. Prakiraan ini dapat menjadi acuan awal redaksi sebelum naskah disetujui editor.$$,
  '{"source":"BMKG","source_url":"https://cuaca.bmkg.go.id/","location":"Jakarta","date":"2026-04-22","day_name":"Rabu","main_condition":"berawan","temperature_min":24,"temperature_max":31,"humidity_min":67,"humidity_max":94,"areas":[{"name":"Jakarta Pusat","condition":"berawan","temperature_min":24,"temperature_max":31,"humidity_min":67,"humidity_max":94}],"time_segments":[{"label":"pagi","condition":"berawan","temperature":25,"humidity":86},{"label":"siang","condition":"berawan tebal","temperature":31,"humidity":72},{"label":"sore","condition":"hujan ringan","temperature":29,"humidity":82},{"label":"malam","condition":"berawan","temperature":26,"humidity":90}],"template_used":"Template 2"}',
  NULL,
  'Scheduled',
  'System',
  '2026-04-22T05:00:00.000Z',
  '2026-04-22T07:00:00.000Z',
  'Pending Review',
  'Editor Piket',
  'Menunggu review editor.',
  '2026-04-22T05:00:00.000Z',
  '2026-04-22T05:00:00.000Z'
),
(
  'BMKG',
  'https://cuaca.bmkg.go.id/',
  'Cuaca',
  'Tangerang Selatan',
  '2026-04-22T00:00:00.000Z',
  'Rabu',
  '[CUACA] Tangerang Selatan - Rabu, 22 April 2026',
  'Cuaca Tangerang Selatan diperkirakan didominasi hujan ringan hingga sedang di sejumlah kecamatan.',
  $$TANGERANG SELATAN– Cuaca di wilayah Tangerang Selatan pada Rabu (22/4) diperkirakan didominasi hujan ringan hingga sedang di sejumlah kecamatan.

Berdasarkan data prakiraan cuaca BMKG, wilayah Serpong, Pamulang, dan Setu diprediksi mengalami hujan sedang dengan suhu berkisar antara 24 hingga 33 derajat Celsius serta tingkat kelembapan udara mencapai 69 hingga 96 persen.

Sementara itu, hujan ringan diperkirakan terjadi di Serpong Utara, Pondok Aren, Ciputat, dan Ciputat Timur. Suhu udara di wilayah tersebut berada pada kisaran 24 hingga 32 derajat Celsius dengan kelembapan antara 68 hingga 98 persen.$$,
  '{"source":"BMKG","source_url":"https://cuaca.bmkg.go.id/","location":"Tangerang Selatan","date":"2026-04-22","day_name":"Rabu","main_condition":"hujan ringan hingga sedang","temperature_min":24,"temperature_max":33,"humidity_min":69,"humidity_max":96,"areas":[{"name":"Serpong","condition":"hujan sedang","temperature_min":24,"temperature_max":33,"humidity_min":69,"humidity_max":96},{"name":"Pamulang","condition":"hujan sedang","temperature_min":24,"temperature_max":33,"humidity_min":69,"humidity_max":96},{"name":"Setu","condition":"hujan sedang","temperature_min":24,"temperature_max":33,"humidity_min":69,"humidity_max":96},{"name":"Serpong Utara","condition":"hujan ringan","temperature_min":24,"temperature_max":32,"humidity_min":68,"humidity_max":98}],"time_segments":[{"label":"pagi","condition":"berawan","temperature":25,"humidity":86},{"label":"siang","condition":"hujan ringan","temperature":31,"humidity":72},{"label":"sore","condition":"hujan ringan","temperature":29,"humidity":82},{"label":"malam","condition":"berawan","temperature":26,"humidity":90}],"template_used":"Template 1"}',
  NULL,
  'Scheduled',
  'System',
  '2026-04-22T05:01:00.000Z',
  '2026-04-22T07:00:00.000Z',
  'Approved',
  'Dina Pramesti',
  'Sudah dicek redaksi.',
  '2026-04-22T05:01:00.000Z',
  '2026-04-22T05:21:00.000Z'
),
(
  'BMKG',
  'https://cuaca.bmkg.go.id/',
  'Cuaca',
  'Depok',
  '2026-04-22T00:00:00.000Z',
  'Rabu',
  '[CUACA] Depok - Rabu, 22 April 2026',
  'Cuaca Depok diperkirakan didominasi hujan ringan yang relatif merata di sejumlah kecamatan.',
  $$DEPOK– Cuaca di wilayah Depok pada Rabu, 22 April 2026, diperkirakan didominasi hujan ringan yang relatif merata di sejumlah kecamatan.

Wilayah Beji, Cimanggis, dan Pancoran Mas diprediksi mengalami hujan ringan dengan suhu berkisar antara 23 hingga 33 derajat Celsius serta tingkat kelembapan antara 68 hingga 98 persen.

Sementara itu, kawasan Sukmajaya juga berpotensi mengalami kondisi serupa. Warga diimbau tetap memperhatikan pembaruan informasi cuaca dari BMKG, terutama menjelang aktivitas luar ruang.$$,
  '{"source":"BMKG","source_url":"https://cuaca.bmkg.go.id/","location":"Depok","date":"2026-04-22","day_name":"Rabu","main_condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98,"areas":[{"name":"Beji","condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98}],"time_segments":[{"label":"pagi","condition":"berawan","temperature":25,"humidity":86},{"label":"siang","condition":"hujan ringan","temperature":31,"humidity":72},{"label":"sore","condition":"hujan ringan","temperature":29,"humidity":82},{"label":"malam","condition":"berawan","temperature":26,"humidity":90}],"template_used":"Template 3"}',
  NULL,
  'Manual',
  'Raka Mahendra',
  '2026-04-22T11:00:00.000Z',
  '2026-04-22T12:00:00.000Z',
  'Revision Needed',
  'Raka Mahendra',
  'Perlu periksa ulang frasa intensitas hujan sebelum approval.',
  '2026-04-22T11:00:00.000Z',
  '2026-04-22T11:18:00.000Z'
),
(
  'BMKG',
  'https://cuaca.bmkg.go.id/',
  'Cuaca',
  'Bekasi',
  '2026-04-22T00:00:00.000Z',
  'Rabu',
  '[CUACA] Bekasi - Rabu, 22 April 2026',
  'Cuaca Bekasi diperkirakan didominasi hujan ringan di sejumlah wilayah pada siang hingga sore hari.',
  $$BEKASI– Cuaca di wilayah Bekasi pada Rabu, 22 April 2026, diperkirakan didominasi hujan ringan di sejumlah wilayah.

Wilayah Bekasi Timur dan Bekasi Selatan diprediksi mengalami hujan ringan dengan suhu berkisar antara 23 hingga 33 derajat Celsius serta kelembapan 68 hingga 98 persen.

Sementara itu, Bekasi Barat dan Bekasi Utara juga berpotensi mengalami kondisi serupa. Redaksi dapat menggunakan naskah ini sebagai draf awal untuk penugasan cepat.$$,
  '{"source":"BMKG","source_url":"https://cuaca.bmkg.go.id/","location":"Bekasi","date":"2026-04-22","day_name":"Rabu","main_condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98,"areas":[{"name":"Bekasi Timur","condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98}],"time_segments":[{"label":"pagi","condition":"berawan","temperature":25,"humidity":86},{"label":"siang","condition":"hujan ringan","temperature":31,"humidity":72},{"label":"sore","condition":"hujan ringan","temperature":29,"humidity":82},{"label":"malam","condition":"berawan","temperature":26,"humidity":90}],"template_used":"Template 3"}',
  NULL,
  'Manual',
  'Maya Sari',
  '2026-04-22T13:00:00.000Z',
  '2026-04-22T13:00:00.000Z',
  'Pending Review',
  'Maya Sari',
  'Menunggu review editor.',
  '2026-04-22T13:00:00.000Z',
  '2026-04-22T13:00:00.000Z'
),
(
  'BMKG',
  'https://cuaca.bmkg.go.id/',
  'Cuaca',
  'Bogor',
  '2026-04-22T00:00:00.000Z',
  'Rabu',
  '[CUACA] Bogor - Rabu, 22 April 2026',
  'Cuaca Bogor diperkirakan didominasi hujan ringan dengan suhu 23 hingga 33 derajat Celsius.',
  $$BOGOR– Cuaca di wilayah Bogor pada Rabu, 22 April 2026, diperkirakan didominasi hujan ringan yang relatif merata di beberapa kecamatan.

Wilayah Bogor Tengah dan Bogor Barat diprediksi mengalami hujan ringan dengan suhu berkisar antara 23 hingga 33 derajat Celsius serta tingkat kelembapan antara 68 hingga 98 persen.

Sementara itu, Bogor Selatan dan Bogor Timur juga berpotensi mengalami kondisi serupa. Warga diimbau tetap memperhatikan pembaruan informasi cuaca dari BMKG.$$,
  '{"source":"BMKG","source_url":"https://cuaca.bmkg.go.id/","location":"Bogor","date":"2026-04-22","day_name":"Rabu","main_condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98,"areas":[{"name":"Bogor Tengah","condition":"hujan ringan","temperature_min":23,"temperature_max":33,"humidity_min":68,"humidity_max":98}],"time_segments":[{"label":"pagi","condition":"berawan","temperature":25,"humidity":86},{"label":"siang","condition":"hujan ringan","temperature":31,"humidity":72},{"label":"sore","condition":"hujan ringan","temperature":29,"humidity":82},{"label":"malam","condition":"berawan","temperature":26,"humidity":90}],"template_used":"Template 3"}',
  NULL,
  'Scheduled',
  'System',
  '2026-04-22T05:04:00.000Z',
  '2026-04-22T07:00:00.000Z',
  'Approved',
  'Editor Piket',
  'Sudah dicek redaksi.',
  '2026-04-22T05:04:00.000Z',
  '2026-04-22T05:24:00.000Z'
);

INSERT INTO "activity_logs" ("article_id", "action", "previous_status", "new_status", "actor_name", "note", "created_at")
VALUES
  (1, 'Scheduled article generated', NULL, 'Pending Review', 'System', 'Seeded into Neon database.', '2026-04-22T05:00:00.000Z'),
  (2, 'Scheduled article generated', NULL, 'Pending Review', 'System', 'Seeded into Neon database.', '2026-04-22T05:01:00.000Z'),
  (2, 'Status updated', 'Pending Review', 'Approved', 'Dina Pramesti', 'Approved after editorial check.', '2026-04-22T05:21:00.000Z'),
  (3, 'Manual article generated', NULL, 'Pending Review', 'Raka Mahendra', 'Seeded into Neon database.', '2026-04-22T11:00:00.000Z'),
  (3, 'Status updated', 'Pending Review', 'Revision Needed', 'Raka Mahendra', 'Needs headline and paragraph review.', '2026-04-22T11:18:00.000Z'),
  (4, 'Manual article generated', NULL, 'Pending Review', 'Maya Sari', 'Seeded into Neon database.', '2026-04-22T13:00:00.000Z'),
  (5, 'Scheduled article generated', NULL, 'Pending Review', 'System', 'Seeded into Neon database.', '2026-04-22T05:04:00.000Z'),
  (5, 'Status updated', 'Pending Review', 'Approved', 'Editor Piket', 'Approved after editorial check.', '2026-04-22T05:24:00.000Z');
