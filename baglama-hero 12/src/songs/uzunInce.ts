import { parseSong } from '../utils/songParser';

const uzunInceData = {
  "meta": {
    "title": "Uzun İnce Bir Yoldayım",
    "artist": "Aşık Veysel Şatıroğlu",
    "instrument": "Bağlama (Kısa/Uzun Sap)",
    "timeSignature": "4/4",
    "key": "La Karar (A Minor - Hüseyni Makamı)",
    "tempo": 80
  },
  "notation_key": {
    "sib2": "Si Bemol 2 (Koma) - Bağlama düzeninde orta tel 2. perde"
  },
  "track": [
    {
      "measure": 1,
      "section": "Söz Girişi",
      "notes": [
        { "note": "Fa", "octave": 4, "duration": "0.5", "lyrics": "U" },
        { "note": "Sol", "octave": 4, "duration": "0.5", "lyrics": "zun" },
        { "note": "La", "octave": 4, "duration": "1.0", "lyrics": "in" },
        { "note": "La", "octave": 4, "duration": "1.0", "lyrics": "ce" }
      ]
    },
    {
      "measure": 2,
      "section": "Söz",
      "notes": [
        { "note": "Sol", "octave": 4, "duration": "0.5", "lyrics": "Bir" },
        { "note": "La", "octave": 4, "duration": "0.5", "lyrics": "" },
        { "note": "Sol", "octave": 4, "duration": "0.5", "lyrics": "yol" },
        { "note": "Fa", "octave": 4, "duration": "0.5", "lyrics": "da" },
        { "note": "Fa", "octave": 4, "duration": "1.0", "lyrics": "yım" },
        { "note": "Mi", "octave": 4, "duration": "1.0", "lyrics": "" }
      ]
    },
    {
      "measure": 3,
      "section": "Söz",
      "notes": [
        { "note": "Fa", "octave": 4, "duration": "0.5", "lyrics": "Gi" },
        { "note": "Sol", "octave": 4, "duration": "0.5", "lyrics": "di" },
        { "note": "Fa", "octave": 4, "duration": "0.5", "lyrics": "yo" },
        { "note": "Mi", "octave": 4, "duration": "0.5", "lyrics": "rum" },
        { "note": "Mi", "octave": 4, "duration": "1.0", "lyrics": "" },
        { "note": "Re", "octave": 4, "duration": "1.0", "lyrics": "" }
      ]
    },
    {
      "measure": 4,
      "section": "Söz",
      "notes": [
        { "note": "Mi", "octave": 4, "duration": "0.5", "lyrics": "Gün" },
        { "note": "Fa", "octave": 4, "duration": "0.5", "lyrics": "" },
        { "note": "Mi", "octave": 4, "duration": "0.5", "lyrics": "düz" },
        { "note": "Re", "octave": 4, "duration": "0.5", "lyrics": "ge" },
        { "note": "Re", "octave": 4, "duration": "1.0", "lyrics": "ce" },
        { "note": "Do", "octave": 4, "duration": "1.0", "lyrics": "" }
      ]
    },
    {
      "measure": 5,
      "section": "Söz",
      "notes": [
        { "note": "Re", "octave": 4, "duration": "0.5", "lyrics": "Gün" },
        { "note": "Mi", "octave": 4, "duration": "0.5", "lyrics": "" },
        { "note": "Re", "octave": 4, "duration": "0.5", "lyrics": "düz" },
        { "note": "Do", "octave": 4, "duration": "0.5", "lyrics": "ge" },
        { "note": "Do", "octave": 4, "duration": "1.0", "lyrics": "ce" },
        { "note": "Si", "accidental": "b2", "octave": 3, "duration": "1.0", "lyrics": "" }
      ]
    },
    {
      "measure": 6,
      "section": "Bitiş (Teslim)",
      "notes": [
        { "note": "Do", "octave": 4, "duration": "0.5", "lyrics": "Gün" },
        { "note": "Re", "octave": 4, "duration": "0.5", "lyrics": "" },
        { "note": "Do", "octave": 4, "duration": "0.5", "lyrics": "düz" },
        { "note": "Si", "accidental": "b2", "octave": 3, "duration": "0.5", "lyrics": "ge" },
        { "note": "Si", "accidental": "b2", "octave": 3, "duration": "1.0", "lyrics": "ce" },
        { "note": "La", "octave": 3, "duration": "1.0", "lyrics": "oy" }
      ]
    }
  ]
};

export const UZUN_INCE = parseSong(uzunInceData);
