import { parseSong } from '../utils/songParser';

const mavilimData = {
  "eser_bilgisi": {
    "ad": "Mavilim Mavişelim",
    "yore": "Keskin",
    "kaynak_kisi": "Hacı Taşan",
    "karar_sesi": "La",
    "usul": "2/4",
    "donanim_ve_arizalar": [
      {
        "nota": "Si",
        "deger": "Bemol 2",
        "aciklama": "Bağlamada orta telde 3. perde (Segah)"
      }
    ]
  },
  "notalar": [
    {
      "bolum": "Giriş / Saz Kısmı",
      "olculer": [
        {
          "olcu": 1,
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Mi", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Mi", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Mi", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 2,
          "sira": [
            { "nota": "Mi", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Mi", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Mi", "sure": "1/4", "vurus": "Alt" }
          ]
        },
        {
          "olcu": 3,
          "aciklama": "Geçiş",
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Mi", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Do", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 4,
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Do", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 5,
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 6,
          "aciklama": "Karar'a iniş",
          "sira": [
            { "nota": "Do", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Alt" },
            { "nota": "La", "sure": "1/8", "vurus": "Üst" }
          ]
        }
      ]
    },
    {
      "bolum": "Söz Kısmı (Mavilim Mavişelim...)",
      "olculer": [
        {
          "olcu": 7,
          "sira": [
            { "nota": "Sol", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Do", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Do", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 8,
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Do", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 9,
          "aciklama": "Tenhada buluşalım...",
          "sira": [
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Re", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Re", "sure": "1/8", "vurus": "Üst" }
          ]
        },
        {
          "olcu": 10,
          "sira": [
            { "nota": "Do", "sure": "1/8", "vurus": "Alt" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Üst" },
            { "nota": "Si", "ariza": "Bemol 2", "sure": "1/8", "vurus": "Alt" },
            { "nota": "La", "sure": "1/8", "vurus": "Üst" }
          ]
        }
      ]
    }
  ]
};

export const MAVILIM = parseSong(mavilimData, 92);
