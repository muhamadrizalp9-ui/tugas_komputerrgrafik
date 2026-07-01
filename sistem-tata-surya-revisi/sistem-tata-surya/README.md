# Galeri Virtual Interaktif: Sistem Tata Surya

Proyek ini adalah aplikasi **Scientific Visualization** berbasis web untuk menampilkan galeri virtual tata surya dalam bentuk 3D. Aplikasi dibuat menggunakan **HTML, CSS, dan JavaScript WebGL murni** tanpa framework eksternal, sehingga struktur kode tetap rapi dan mudah dijelaskan saat presentasi.

## Fitur Utama

1. Visualisasi 3D Matahari dan 8 planet.
2. File planet dipisahkan satu per satu di folder `src/planets/`.
3. Transformasi objek terpilih:
   - Translasi X, Y, Z.
   - Rotasi X, Y, Z.
   - Scaling.
4. Pencahayaan interaktif:
   - Mengubah posisi sumber cahaya X, Y, Z.
   - Mengubah intensitas cahaya.
   - Mode Phong Shading dan Lambertian.
5. UI panel kontrol:
   - Pilih objek planet dari dropdown.
   - Pilih planet cepat melalui tombol chip di atas canvas.
   - Fokus kamera ke objek terpilih.
   - Tombol **Lihat Semua Tata Surya** untuk kembali ke tampilan luas.
   - Reset transformasi.
   - Informasi teknis objek: posisi, radius, jumlah vertex, jumlah segitiga/poligon, model shading, dan catatan objek.
6. Interaksi mouse:
   - Drag untuk memutar kamera.
   - Scroll untuk zoom.
   - Klik langsung pada planet untuk memilih planet dan fokus ke detailnya.

## Cara Menjalankan

Karena proyek menggunakan JavaScript module, jalankan melalui server lokal, bukan langsung klik file `index.html`.

### Opsi 1 - VS Code Live Server

1. Buka folder proyek di Visual Studio Code.
2. Install extension **Live Server**.
3. Klik kanan `index.html`.
4. Pilih **Open with Live Server**.

### Opsi 2 - Python HTTP Server

Buka terminal di folder proyek, lalu jalankan:

```bash
python -m http.server 5500
```

Kemudian buka browser:

```text
http://localhost:5500
```

## Struktur Folder

```text
sistem-tata-surya/
├── index.html
├── css/
│   └── style.css
├── src/
│   ├── main.js
│   ├── planets/
│   │   ├── index.js
│   │   ├── matahari.js
│   │   ├── merkurius.js
│   │   ├── venus.js
│   │   ├── bumi.js
│   │   ├── mars.js
│   │   ├── jupiter.js
│   │   ├── saturnus.js
│   │   ├── uranus.js
│   │   └── neptunus.js
│   └── webgl/
│       ├── geometry.js
│       ├── math.js
│       └── shaders.js
└── docs/
    └── bab-komponen-teknis-dan-langkah-pengerjaan.md
```

## Pembagian Fungsi File

| File | Fungsi |
|---|---|
| `index.html` | Struktur halaman, canvas WebGL, panel kontrol, dan panel informasi teknis. |
| `css/style.css` | Tampilan UI, layout galeri, panel, tombol, slider, dan responsivitas. |
| `src/main.js` | Logika utama rendering, animasi orbit, kamera, input slider, picking/klik planet, fokus kamera, dan update informasi objek. |
| `src/webgl/geometry.js` | Generator geometri bola, orbit, cincin, dan bintang. |
| `src/webgl/math.js` | Fungsi matematika grafika komputer: matriks, perspektif, lookAt, transformasi, dan vektor. |
| `src/webgl/shaders.js` | Vertex shader dan fragment shader untuk pencahayaan Phong/Lambertian. |
| `src/planets/*.js` | Data masing-masing planet: radius, warna, orbit, rotasi, kemiringan sumbu, dan deskripsi. |
