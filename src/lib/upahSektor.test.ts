import { describe, it, expect } from 'vitest';
import {
  ATURAN_DATA_UPAH,
  DAFTAR_SEKTOR,
  PERSEN_SUMBAR_TERHADAP_NASIONAL,
  bandingkanDenganRataRata,
  buatKonteksPasarUntukAi,
  cariSektor,
} from './upahSektor';

describe('data upah sektor', () => {
  it('memuat 17 lapangan usaha dengan kode unik dan angka positif', () => {
    expect(DAFTAR_SEKTOR).toHaveLength(17);
    expect(new Set(DAFTAR_SEKTOR.map((s) => s.kode)).size).toBe(17);
    DAFTAR_SEKTOR.forEach((s) => expect(s.rata_nasional).toBeGreaterThan(0));
  });

  it('rata-rata Sumbar sekitar 87% dari nasional (Agustus 2025)', () => {
    expect(PERSEN_SUMBAR_TERHADAP_NASIONAL).toBe(87);
  });
});

describe('bandingkanDenganRataRata', () => {
  it('mengembalikan null jika sektor tidak diketahui atau gaji tidak valid', () => {
    expect(bandingkanDenganRataRata(3000000, 'tidak_tahu', 'penuh_waktu')).toBeNull();
    expect(bandingkanDenganRataRata(3000000, 'ZZ', 'penuh_waktu')).toBeNull();
    expect(bandingkanDenganRataRata(3000000, undefined, 'penuh_waktu')).toBeNull();
    expect(bandingkanDenganRataRata(0, 'J', 'penuh_waktu')).toBeNull();
  });

  it('tidak membandingkan nominal per jam, per hari, atau uang saku magang', () => {
    expect(bandingkanDenganRataRata(25000, 'G', 'paruh_waktu')).toBeNull();
    expect(bandingkanDenganRataRata(130000, 'G', 'harian')).toBeNull();
    expect(bandingkanDenganRataRata(1500000, 'G', 'magang')).toBeNull();
    expect(bandingkanDenganRataRata(2800000, 'G', 'tidak_tahu')).toBeNull();
  });

  it('menghitung persen terhadap rata-rata nasional sektor', () => {
    const hasil = bandingkanDenganRataRata(2639353, 'J', 'penuh_waktu'); // setengah dari 5.278.706
    expect(hasil?.persenDariRataNasional).toBe(50);
    expect(hasil?.rataSektorDiBawahUmp).toBe(false);
  });

  it('kasus demo: Toko, Rp2.800.000 penuh waktu', () => {
    const hasil = bandingkanDenganRataRata(2800000, 'G', 'penuh_waktu');
    expect(hasil?.rataNasionalSektor).toBe(2839730);
    expect(hasil?.persenDariRataNasional).toBe(99);
    expect(hasil?.rataSumbarSemuaSektor).toBe(2911450);
    expect(hasil?.catatan.some((c) => c.includes('bukan patokan layak'))).toBe(true);
  });

  it('memberi catatan khusus jika rata-rata sektor di bawah UMP', () => {
    const hasil = bandingkanDenganRataRata(2500000, 'I', 'penuh_waktu'); // hotel, restoran: 2.547.160
    expect(hasil?.rataSektorDiBawahUmp).toBe(true);
    expect(hasil?.catatan.some((c) => c.includes('bukan patokan layak'))).toBe(true);
  });
});

describe('buatKonteksPasarUntukAi', () => {
  const dasar = { gaji_bulanan: 3000000, jenis_pekerjaan: 'penuh_waktu' as const };

  it('menyebut sumber BPS dan label nasional', () => {
    const teks = buatKonteksPasarUntukAi({ ...dasar, sektor_usaha: 'G' }).join('\n');
    expect(teks).toContain(cariSektor('G')!.label);
    expect(teks).toContain('nasional');
    expect(teks).toContain('BPS');
  });

  it('tetap aman jika sektor belum diisi', () => {
    expect(buatKonteksPasarUntukAi(dasar)[0]).toContain('belum diketahui');
  });

  it('tidak mengirim angka rata-rata untuk paruh waktu', () => {
    const baris = buatKonteksPasarUntukAi({
      gaji_bulanan: 25000,
      jenis_pekerjaan: 'paruh_waktu',
      sektor_usaha: 'G',
    });
    expect(baris).toHaveLength(1);
    expect(baris[0]).toContain('tidak dipakai');
    expect(baris[0]).not.toMatch(/Rp\d/);
  });

  it('mengembalikan array kosong jika tawaran belum ada', () => {
    expect(buatKonteksPasarUntukAi(null)).toEqual([]);
  });
});

describe('ATURAN_DATA_UPAH', () => {
  it('melarang rata-rata dipakai untuk membenarkan gaji di bawah UMP', () => {
    expect(ATURAN_DATA_UPAH).toContain('tidak boleh dipakai untuk membenarkan tawaran di bawah UMP');
  });
});
