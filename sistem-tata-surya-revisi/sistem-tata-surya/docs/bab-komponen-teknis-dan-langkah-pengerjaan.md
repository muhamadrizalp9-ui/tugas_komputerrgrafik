# BAB: Komponen Teknis dan Langkah-Langkah Pengerjaan

## 1. Identitas Proyek

**Judul proyek:** Galeri Virtual Interaktif: Sistem Tata Surya  
**Tema:** Scientific Visualization  
**Platform:** Web  
**Teknologi:** HTML, CSS, JavaScript, WebGL  
**Objek utama:** Matahari, Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, dan Neptunus.

Proyek ini dibuat untuk menampilkan sistem tata surya sebagai ruang galeri virtual 3D. Pengguna dapat melihat seluruh tata surya dari tampilan luas, memilih planet melalui dropdown, tombol cepat, atau klik langsung pada planet, lalu kamera akan fokus ke objek yang dipilih agar detail planet dapat diamati lebih jelas. Pengguna juga dapat melihat orbit, mengubah transformasi objek, mengatur pencahayaan, dan membaca informasi teknis objek yang sedang ditampilkan.

---

## 2. Komponen Teknis

### 2.1 Manipulasi Objek

Aplikasi menyediakan kontrol untuk melakukan tiga transformasi utama pada objek 3D, yaitu:

1. **Translasi**  
   Translasi adalah proses menggeser posisi objek dari titik awal ke posisi baru. Pada proyek ini, translasi dilakukan melalui slider X, Y, dan Z. Nilai translasi kemudian ditambahkan ke posisi orbit planet.

2. **Rotasi**  
   Rotasi adalah proses memutar objek terhadap sumbu tertentu. Pada proyek ini, rotasi dilakukan terhadap sumbu X, Y, dan Z. Selain rotasi dari slider, planet juga memiliki rotasi otomatis agar terlihat hidup.

3. **Scaling**  
   Scaling adalah proses memperbesar atau memperkecil ukuran objek. Pada proyek ini, scaling dilakukan melalui slider yang mengubah skala objek terpilih tanpa mengubah ukuran planet lain.

Secara konsep, transformasi objek disusun dalam bentuk matriks model:

```text
ModelMatrix = Translation * RotationX * RotationY * RotationZ * Scale
```

Matriks ini dikirim ke vertex shader untuk mengubah posisi vertex dari koordinat lokal objek menjadi koordinat dunia.

---

### 2.2 Pencahayaan dan Rendering

Aplikasi menggunakan shader WebGL untuk menghitung warna objek berdasarkan arah cahaya dan arah kamera. Tersedia dua mode pencahayaan:

1. **Lambertian Shading**  
   Lambertian menggunakan komponen ambient dan diffuse. Model ini membuat bagian objek yang menghadap cahaya terlihat lebih terang, sedangkan bagian yang membelakangi cahaya lebih gelap.

2. **Phong Shading**  
   Phong Shading menambahkan komponen specular pada Lambertian. Komponen specular menghasilkan efek kilau kecil pada objek, sehingga bentuk 3D terlihat lebih jelas.

Rumus sederhana yang digunakan:

```text
Warna akhir = Ambient + Diffuse + Specular
```

Keterangan:

- **Ambient**: cahaya dasar agar objek tidak sepenuhnya gelap.
- **Diffuse**: cahaya yang bergantung pada sudut antara permukaan objek dan sumber cahaya.
- **Specular**: pantulan kilau berdasarkan arah kamera dan arah refleksi cahaya.

Pengguna dapat mengubah:

- Intensitas cahaya.
- Posisi cahaya pada sumbu X.
- Posisi cahaya pada sumbu Y.
- Posisi cahaya pada sumbu Z.
- Mode shading antara Phong dan Lambertian.

---

### 2.3 User Interface

UI dibuat dalam tiga bagian utama:

1. **Panel kiri**  
   Digunakan untuk memilih objek, melakukan fokus kamera, kembali ke tampilan seluruh tata surya, dan mengatur transformasi objek.

2. **Canvas tengah**  
   Digunakan sebagai ruang galeri 3D tempat tata surya dirender. Pada bagian atas canvas terdapat tombol cepat nama planet. Planet juga dapat diklik langsung agar objek tersebut terpilih dan kamera fokus ke detailnya.

3. **Panel kanan**  
   Digunakan untuk mengatur pencahayaan, kecepatan orbit, dan membaca informasi teknis objek.

Informasi teknis yang ditampilkan meliputi:

- Nama objek.
- Jenis objek.
- Koordinat posisi X, Y, Z.
- Nilai transformasi aktif.
- Radius model.
- Radius orbit.
- Jumlah vertex.
- Jumlah segitiga/poligon.
- Model shading.
- Deskripsi singkat objek.

---

### 2.4 Struktur Kode

Kode tidak digabung dalam satu file agar sesuai dengan kebutuhan proyek kelompok dan lebih mudah dibagi tugas.

| Folder/File | Fungsi |
|---|---|
| `index.html` | Membuat struktur halaman, canvas, dan panel kontrol. |
| `css/style.css` | Mengatur tampilan halaman, warna, panel, tombol, dan slider. |
| `src/main.js` | Mengatur proses rendering, animasi, input UI, kamera, picking/klik planet, fokus objek, dan informasi objek. |
| `src/webgl/geometry.js` | Membuat geometri bola, orbit, cincin planet, dan bintang. |
| `src/webgl/math.js` | Menyediakan fungsi matematika seperti matriks transformasi, perspektif, dan kamera. |
| `src/webgl/shaders.js` | Menyimpan kode vertex shader dan fragment shader. |
| `src/planets/*.js` | Menyimpan data masing-masing planet secara terpisah. |

---

## 3. Langkah-Langkah Pengerjaan

### 3.1 Tahap Persiapan

1. Menentukan tema proyek, yaitu **Scientific Visualization: Sistem Tata Surya**.
2. Menentukan teknologi yang digunakan, yaitu WebGL berbasis web.
3. Membuat struktur folder agar kode tidak menumpuk pada `index.html`.
4. Menyiapkan file utama:
   - `index.html`
   - `css/style.css`
   - `src/main.js`
   - folder `src/planets/`
   - folder `src/webgl/`

---

### 3.2 Tahap Pemodelan Objek

1. Membuat geometri bola dengan fungsi `createSphere()`.
2. Bola digunakan untuk semua planet dan Matahari.
3. Setiap planet memiliki data tersendiri, yaitu:
   - nama planet,
   - radius,
   - warna,
   - jarak orbit,
   - kecepatan orbit,
   - kecepatan rotasi,
   - kemiringan sumbu,
   - deskripsi.
4. Saturnus dan Uranus diberi geometri cincin menggunakan fungsi `createAnnulus()`.
5. Orbit planet dibuat menggunakan fungsi `createOrbitCircle()`.

---

### 3.3 Tahap Implementasi Transformasi

1. Membaca nilai slider translasi, rotasi, dan scaling dari panel kontrol.
2. Menyimpan nilai transformasi untuk masing-masing objek.
3. Menggabungkan posisi orbit otomatis dengan translasi manual.
4. Menyusun matriks model objek.
5. Mengirim matriks model ke shader.
6. Menampilkan perubahan objek secara real-time di canvas.

Contoh urutan transformasi:

```text
1. Objek berada pada posisi orbit.
2. Slider translasi menggeser objek.
3. Slider rotasi memutar objek.
4. Slider scaling memperbesar atau memperkecil objek.
5. Shader menggambar objek berdasarkan hasil transformasi tersebut.
```

---

### 3.4 Tahap Lighting dan Shading

1. Membuat vertex shader untuk menghitung posisi vertex di ruang dunia.
2. Membuat fragment shader untuk menghitung warna setiap piksel.
3. Menambahkan cahaya ambient agar objek tetap terlihat.
4. Menambahkan cahaya diffuse agar bentuk objek terlihat berdimensi.
5. Menambahkan specular untuk mode Phong Shading.
6. Menyediakan slider intensitas cahaya.
7. Menyediakan slider posisi cahaya X, Y, dan Z.

---

### 3.5 Tahap Finalisasi UI

1. Membuat layout tiga kolom: kontrol, canvas besar, dan informasi teknis.
2. Memperbesar area canvas agar tampilan tata surya tidak terasa terlalu sempit.
3. Menambahkan tombol fokus kamera.
4. Menambahkan tombol **Lihat Semua Tata Surya** untuk kembali ke tampilan luas.
5. Menambahkan tombol cepat planet pada bagian atas canvas.
6. Menambahkan fitur klik langsung pada planet menggunakan perhitungan proyeksi posisi planet ke koordinat layar.
7. Menambahkan tombol reset transformasi.
8. Menambahkan informasi FPS dan status WebGL.
9. Menambahkan desain visual bertema ruang angkasa.
10. Membuat tampilan responsif agar tetap nyaman dilihat pada layar lebih kecil.

---

## 4. Workflow Program

Alur kerja program adalah sebagai berikut:

```text
Browser membuka index.html
        ↓
CSS memuat tampilan halaman
        ↓
main.js mengambil data planet dari src/planets/
        ↓
WebGL membuat shader, buffer, dan geometri
        ↓
Render loop berjalan dengan requestAnimationFrame
        ↓
Planet bergerak mengorbit dan berotasi
        ↓
Input slider mengubah transformasi/pencahayaan
        ↓
Klik planet/dropdown/tombol cepat memilih objek
        ↓
Kamera dapat fokus ke planet terpilih atau kembali ke tampilan seluruh tata surya
        ↓
Panel informasi teknis diperbarui secara real-time
```

---

## 5. Analisis Algoritma Transformasi

Transformasi pada proyek ini memakai pendekatan matriks 4x4. Matriks 4x4 umum digunakan pada grafika komputer 3D karena dapat merepresentasikan translasi, rotasi, scaling, proyeksi, dan posisi kamera.

### 5.1 Translasi

Translasi mengubah posisi objek dengan menambahkan nilai X, Y, dan Z.

```text
x' = x + tx
y' = y + ty
z' = z + tz
```

Pada program, nilai `tx`, `ty`, dan `tz` berasal dari slider.

### 5.2 Rotasi

Rotasi dilakukan menggunakan sudut dalam radian. Nilai dari slider masih berupa derajat, sehingga diubah terlebih dahulu ke radian.

```text
radian = degree × π / 180
```

Rotasi diterapkan pada sumbu X, Y, dan Z.

### 5.3 Scaling

Scaling mengubah ukuran objek dengan faktor skala.

```text
x' = x × s
y' = y × s
z' = z × s
```

Jika nilai skala lebih dari 1, objek membesar. Jika nilai skala kurang dari 1, objek mengecil.

---

## 6. Cara Pengujian Fitur

| Fitur | Cara Menguji | Hasil yang Diharapkan |
|---|---|---|
| Pilih objek | Pilih planet dari dropdown, tombol cepat, atau klik langsung pada planet | Panel informasi berubah sesuai planet dan kamera dapat fokus ke objek. |
| Translasi | Geser slider X/Y/Z | Planet terpilih bergeser. |
| Rotasi | Geser slider rotasi X/Y/Z | Planet terpilih berputar sesuai sumbu. |
| Scaling | Geser slider scaling | Ukuran planet terpilih berubah. |
| Posisi cahaya | Geser Light X/Y/Z | Arah terang dan gelap pada objek berubah. |
| Intensitas cahaya | Geser slider intensitas | Objek menjadi lebih terang atau redup. |
| Shading | Ganti Phong/Lambertian | Efek kilau muncul/hilang. |
| Kamera | Drag mouse dan scroll | Sudut pandang dan zoom berubah. |
| Fokus kamera | Klik tombol fokus atau klik planet pada canvas | Kamera mengarah ke planet terpilih untuk melihat detail. |
| Lihat semua | Klik tombol Lihat Semua Tata Surya | Kamera kembali ke tampilan luas agar semua orbit terlihat. |
| Reset | Klik reset transformasi | Transformasi planet kembali ke awal. |

---

## 7. Saran Pembagian Tugas Kelompok

| Anggota | Tanggung Jawab |
|---|---|
| Anggota 1 | Membuat struktur HTML dan desain UI. |
| Anggota 2 | Membuat data planet di folder `src/planets/`. |
| Anggota 3 | Mengatur WebGL, geometri, shader, dan pencahayaan. |
| Anggota 4 | Menulis laporan, mengambil screenshot, dan membuat video demo. |

---

## 8. Kesimpulan

Proyek ini memenuhi kebutuhan galeri virtual interaktif karena menampilkan objek 3D, menyediakan manipulasi transformasi, menerapkan model pencahayaan, dan menampilkan UI informasi teknis. Struktur kode juga dibuat modular sehingga mudah dibaca, dikembangkan, dan dipresentasikan sebagai tugas kelompok.
