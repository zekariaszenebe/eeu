// Dictionary and helper utilities for bilingual (Amharic & English)
// EEU Feeder Landmarks, Substation Communities, and Neighborhood names
// Translates/transliterates Amharic locations into natural Ethiopian Latin phonetics
// (e.g. "ቤተ መንግስት ጊቡ ውስጥ በከፊል" -> "Bete Mengst Gibi Wust Bekefil")

export type LanguageMode = 'en' | 'am';

// Comprehensive dictionary of Amharic landmark names to English/Latin phonetic spelling
export const AMHARIC_TO_ENGLISH_DICT: Record<string, string> = {
  // Key Operational & Positional Terms
  'ቤተመንግስት': 'Bete Mengst',
  'ቤተ መንግስት': 'Bete Mengst',
  'ቤ/መንግስት': 'Bete Mengst',
  'ቤተ መንግስት ጊቡ ውስጥ በከፊል': 'Bete Mengst Gibi Wust Bekefil',
  'ቤተ መንግስት ጊቢ ውስጥ በከፊል': 'Bete Mengst Gibi Wust Bekefil',
  'ቤተ መንግስት ጊቢ ውስጥ ሙሉ': 'Bete Mengst Gibi Wust Mulu',
  'ቤተመንግስት ጊቢ ውስጥ ሙሉ': 'Bete Mengst Gibi Wust Mulu',
  'ጊቢ ውስጥ በከፊል': 'Gibi Wust Bekefil',
  'ጊቡ ውስጥ በከፊል': 'Gibu Wust Bekefil',
  'ጊቢ ውስጥ ሙሉ': 'Gibi Wust Mulu',
  'ጊቢ ውስጥ': 'Gibi Wust',
  'ጊቡ ውስጥ': 'Gibu Wust',
  'ጊቢ': 'Gibi',
  'ጊቡ': 'Gibu',
  'ውስጥ': 'Wust',
  'በከፊል': 'Bekefil',
  'ሙሉ': 'Mulu',
  'ሙሉ በሙሉ': 'Mulu Bemulu',
  'አካባቢ': 'Akababi',
  'አካባቢው': 'Akababiw',
  'አካባቢዎች': 'Akababiwoch',
  'አክባቢ': 'Akababi',
  'አከባቢ': 'Akababi',
  'አከባቢው': 'Akababiw',
  'እና አካባቢው': 'Ena Akababiw',
  'እናአካባቢው': 'Ena Akababiw',
  'እና አከባቢው': 'Ena Akababiw',
  'ጀርባ': 'Jerba',
  'በስተጀርባ': 'Bestejerba',
  'ፊት ለፊት': 'Fit Lefit',
  'ፊትለፊት': 'Fit Lefit',
  'ፊትላፊት': 'Fit Lefit',
  'አጠገብ': 'Ategeb',
  'ጎን': 'Gon',
  'ጋር': 'Gar',
  'ድረስ': 'Dres',
  'ላይ': 'Lay',
  'ታች': 'Tach',
  'በላይ': 'Belay',
  'በታች': 'Betach',
  'በስተግራ': 'Bestegra',
  'በስተቀኝ': 'Besteken',
  'እና': 'Ena',
  'ወደ': 'Wede',
  'ከ': 'Ke',
  'በ': 'Be',
  'ለ': 'Le',

  // Common Facilities & Structural Words
  'ሕንጻ': 'Hntsa',
  'ሕንፃ': 'Hntsa',
  'ህንጻ': 'Hntsa',
  'ህንፃ': 'Hntsa',
  'ሆቴል': 'Hotel',
  'ሆል': 'Hotel',
  'ሆስፒታል': 'Hospital',
  'ክሊኒክ': 'Clinic',
  'ት/ቤት': 'T/Bet',
  'ትምህርት ቤት': 'Tmhert Bet',
  '2ተኛ ደረጃ ት/ቤት': '2tenga Dereja T/Bet',
  '2ኛ ደረጃ ት/ቤት': '2tenga Dereja T/Bet',
  '1ኛ ደረጃ ት/ቤት': '1nga Dereja T/Bet',
  'ዩኒቨርስቲ': 'University',
  'ዩኒቨርሲቲ': 'University',
  'ኮሌጅ': 'College',
  'ቤ/ክ': 'B/K',
  'ቤ/ክርስቲያን': 'Betekrstiyan',
  'ቤተክርስቲያን': 'Betekrstiyan',
  'መስጊድ': 'Mesgid',
  'ኮንዶሚኒየም': 'Condominium',
  'ኮንዶሚንየም': 'Condominium',
  'ኮንዶኒየም': 'Condominium',
  'ፋብሪካ': 'Fabrika',
  'ፋበሪካ': 'Fabrika',
  'መናፈሻ': 'Menafesha',
  'ፓርክ': 'Park',
  'ገበያ': 'Gebeya',
  'አደባባይ': 'Adebabay',
  'መንደር': 'Mender',
  'ሰፈር': 'Sefer',
  'ሰፈራ': 'Sefera',
  'መንገድ': 'Menged',
  'ድልድይ': 'Dildiy',
  'ወፍጮ': 'Wefcho',
  'ቄራ': 'Kera',
  'በረንዳ': 'Berenda',
  'ተራ': 'Tera',
  'ማዞሪያ': 'Mazoriya',
  'ማዕከል': 'Maekel',
  'መጋዘን': 'Megazen',
  'ጋራዥ': 'Garage',
  'ጋራጅ': 'Garage',
  'ጣቢያ': 'Tabiya',
  'ጤና ጣቢያ': 'Tena Tabiya',
  'ሴንተር': 'Center',
  'ፍርድ ቤት': 'Frd Bet',
  'መኖሪያ': 'Menoriya',
  'ቤቶች': 'Betoch',
  'ማህበር': 'Mahber',
  'ማሕበር': 'Mahber',
  'ማህበራት': 'Mahberat',
  'ክበብ': 'Kebeb',
  'መከላከያ': 'Mekelakeya',
  'ካምፕ': 'Camp',
  'ፖሊስ': 'Police',
  'እሳት አደጋ': 'Esat Adega',
  'ውኃ': 'Wuha',
  'ውሀ': 'Wuha',
  'ውሃ': 'Wuha',
  'ግድብ': 'Gidib',
  'ዳቦ': 'Dabo',
  'ዶቦ': 'Dabo',
  'ቡና': 'Buna',
  'ባንክ': 'Bank',
  'ቴሌ': 'Tele',
  'መብራት ኃይል': 'Mebrat Hayil',
  'ሰብስቴሽን': 'Substation',
  'ማከፋፈያ': 'Makefafeya',
  'መናኸሪያ': 'Menahariya',
  'መናሀሪያ': 'Menahariya',
  'ኤምባሲ': 'Embassy',
  'ኤምበሲ': 'Embassy',
  'ኢምባሲ': 'Embassy',
  'ኢንባሲ': 'Embassy',
  'ከተማ': 'Ketema',
  'ማዘጋጃ': 'Mazegaja',
  'ማዘጋጃ ቤት': 'Mazegaja Bet',
  'መስተዳደር': 'Mestedader',
  'ኢንዱስትሪ': 'Industry',
  'ሪል እስቴት': 'Real Estate',
  'ሪልኤስቴት': 'Real Estate',
  'ሪልስቴት': 'Real Estate',
  'ሞል': 'Mall',
  'ፕላዛ': 'Plaza',
  'ካፌ': 'Cafe',
  'ሬስቶራንት': 'Restaurant',
  'ዳታ ሴንተር': 'Data Center',
  'ስታዲየም': 'Stadium',
  'ፓርላማ': 'Parlama',
  'ኬላ': 'Kela',
  'እርባታ': 'Erbata',

  // Major Sub-cities & Neighborhoods
  'ሜክሲኮ': 'Mexico',
  'ለገሐር': 'Legehar',
  'ለገሃር': 'Legehar',
  'ፍላሚንጎ': 'Flamingo',
  'ኦሎምፒያ': 'Olympia',
  'ደንበል': 'Dembel',
  'ቦሌ': 'Bole',
  'ፒኮክ': 'Peacock',
  'ገነት': 'Genet',
  'ልደታ': 'Lideta',
  'ሳር ቤት': 'Sar Bet',
  'ሳርቤት': 'Sar Bet',
  'ቂርቆስ': 'Kirkos',
  'ጨርቆስ': 'Cherkos',
  'ካሳንቺስ': 'Kasanchis',
  'ካዛንቺስ': 'Kazanchis',
  'ሾላ': 'Shola',
  'የካ': 'Yeka',
  'መገናኛ': 'Megenagna',
  'ጎላጎል': 'Golagol',
  'አድዋ': 'Adwa',
  'ባልደራስ': 'Balderas',
  'አቧሬ': 'Abware',
  'ቤለር': 'Beler',
  'አትላስ': 'Atlas',
  'ሻላ': 'Shala',
  'ሩዋንዳ': 'Rwanda',
  'ቀጨኔ': 'Kechene',
  'ሽሮ ሜዳ': 'Shiro Meda',
  'ሽሮሜዳ': 'Shiro Meda',
  'ላዛሪስት': 'Lazarist',
  '6 ኪሎ': '6 Kilo',
  'ስድስት ኪሎ': '6 Kilo',
  '4 ኪሎ': '4 Kilo',
  'አራት ኪሎ': '4 Kilo',
  '5 ኪሎ': '5 Kilo',
  '5ኪሎ': '5 Kilo',
  '10 ኪሎ': '10 Kilo',
  'አፍንጮ በር': 'Afincho Ber',
  'ደጃች ውቤ': 'Dejach Wube',
  'ጊዮርጊስ': 'Giorgis',
  'ሰሜን': 'Semen',
  'ደቡብ': 'Debub',
  'ምስራቅ': 'Misrak',
  'ምሥራቅ': 'Misrak',
  'ምዕራብ': 'Mirab',
  'ሸገር': 'Sheger',
  'ሩፋኤል': 'Rufael',
  'ፓስተር': 'Pasteur',
  'አቤት': 'AaBET',
  'አራብሳ': 'Arabsa',
  'በሻሌ': 'Beshale',
  'ሰሚት': 'Summit',
  'ኮልፌ': 'Kolfe',
  'ታይዋን': 'Taiwan',
  'አዲስ ከተማ': 'Addis Ketema',
  'አማኑኤል': 'Amanuel',
  'አስኮ': 'Asko',
  'ቀራንዮ': 'Keranyo',
  'ቀራኒዮ': 'Keranyo',
  'ቤተል': 'Bethel',
  'ጦር ኃሎች': 'Tor Hailoch',
  'ጦርኃይሎች': 'Tor Hailoch',
  'ወይራ': 'Weyra',
  'አንፎ': 'Anfo',
  'አለም ባንክ': 'Alem Bank',
  'ዓለም ባንክ': 'Alem Bank',
  'ዓለምገና': 'Alem Gena',
  'አለምገና': 'Alem Gena',
  'አቃቂ': 'Akaki',
  'አያት': 'Ayat',
  'መሪ': 'Meri',
  'ጀርመን': 'German',
  'ቤላ': 'Bella',
  'ሚኒሊክ': 'Menelik',
  'ፈረንሳይ': 'Ferensay',
  'ጉራራ': 'Gurara',
  'ጉለሌ': 'Gullele',
  'እንጦጦ': 'Entoto',
  'መርካቶ': 'Merkato',
  'አብነት': 'Abnet',
  'ተ/ኃይማኖት': 'Tekle Haimanot',
  'ተ/ሃይማኖት': 'Tekle Haimanot',
  'ተክለሃይማኖት': 'Tekle Haimanot',
  'ተክለ ሀይማኖት': 'Tekle Haimanot',
  'ጣሊያን': 'Italian',
  'ፒያሳ': 'Piazza',
  'ሰንጋተራ': 'Senga Tera',
  'ሰንጋ ተራ': 'Senga Tera',
  'ጥቁር አንበሳ': 'Tikur Anbessa',
  'ኩባ': 'Cuba',
  'አምባሳደር': 'Ambassador',
  'ሸራተን': 'Sheraton',
  'ባሻወልዴ': 'Basha Wolde',
  'ኮተቤ': 'Kotebe',
  'ላምበረት': 'Lamberet',
  'ላም በረት': 'Lamberet',
  'ጉርድ ሾላ': 'Gurd Shola',
  'ሲቪል ሰርቪስ': 'Civil Service',
  'ፊጋ': 'Figa',
  'ጎሮ': 'Goro',
  'ካራ': 'Kara',
  'አባዶ': 'Abado',
  'ሳሊተ ምሕረት': 'Salite Mehret',
  'ሳሊተምሕረት': 'Salite Mehret',
  'ሳሊተ ምህረት': 'Salite Mehret',
  'ሲኤምሲ': 'CMC',
  'ሲኤም ሲ': 'CMC',
  'ገፈርሳ': 'Gefersa',
  'ታጠቅ': 'Tatek',
  'ቡራዩ': 'Burayu',
  'ገላን': 'Gelan',
  'ቱሉዲምቱ': 'Tulu Dimtu',
  'ቱሉ ዲምቱ': 'Tulu Dimtu',
  'ዱከም': 'Dukem',
  'ቃሊቲ': 'Kaliti',
  'ጎፋ': 'Gofa',
  'ላፍቶ': 'Lafto',
  'መካኒሳ': 'Mekanisa',
  'ባቱ': 'Batu',
  'ቂሊንጦ': 'Kilinto',
  'ጨፌ': 'Chefe',
  'ቡልቡላ': 'Bulbula',
  'ሳሪስ': 'Saris',
  'ፋፋ': 'Fafa',
  'አደይ አበባ': 'Adey Abeba',
  'ኮዬ': 'Koye',
  'ኮዬ ፈጬ': 'Koye Feche',
  'ለገጣፎ': 'Legetafo',
  'ለገዳዲ': 'Legedadi',
  'ሰንዳፋ': 'Sendafa',
  'ሃና ማርያም': 'Hana Maryam',
  'ሐና ማርያም': 'Hana Maryam',
  'ለቡ': 'Lebu',
  'ጀሞ': 'Jemo',
  'ጀሞ 3': 'Jemo 3',
  'ቆሼ': 'Koshe',
  'ኃይሌ ጋርመንት': 'Haile Garment',
  'ንፋስ ስልክ': 'Nifas Silk',
  'ጎተራ': 'Gotera',
  'ወሎ ሰፈር': 'Wollo Sefer',
  'ላንቻ': 'Lancha',
  'በቅሎ ቤት': 'Beklo Bet',
  'ሪቼ': 'Riche',
  'ረጲ': 'Repi',
  'ሰበታ': 'Sebeta',
  'ሸጎሌ': 'Shegole',
  'ዊንጌት': 'Wingate',
  'ሱሉልታ': 'Sululta',
  'ወረገኑ': 'Weregenu',
  'ገርጂ': 'Gerji',
  'ጃክሮስ': 'Jackros',
  'አየር ጤና': 'Ayer Tena',
  'አየር መንገድ': 'Airlines',
  'ሰባተኛ': 'Sebategna',
  'አሸዋ': 'Ashewa',
  'አሸዋ ተራ': 'Ashewa Tera',
  'ዘነበወርቅ': 'Zenebework',
  'ፉሪ': 'Furi',
  'ወለቴ': 'Welete',
  'ካራቆሬ': 'Karakore',

  // Landmark names & Specific areas
  'ደብረወርቅ': 'Debrework',
  'ኤግዝቢሽን': 'Exhibition',
  'ፐርፕል': 'Purple',
  'አስቴር': 'Aster',
  'ኮካኮላ': 'Coca-Cola',
  'ኮካ': 'Coca-Cola',
  'ኢትዮጵያ': 'Ethiopia',
  'ቤተዛታ': 'Betezata',
  'ኦሮሚያ': 'Oromia',
  'ባሕል': 'Bahel',
  'ባህል': 'Bahel',
  'ጊዮን': 'Ghion',
  'እስጢፋኖስ': 'Estifanos',
  'ኃይለ ዓለም': 'Haile Alem',
  'ዘፍመሽ': 'Zefmesh',
  'ዳውን ታውን': 'Downtown',
  'አውራሪስ': 'Awraris',
  'ካልዲስ': 'Kaldis',
  'መድሓኒዓለም': 'Medhanialem',
  'መድኃኔዓለም': 'Medhanialem',
  'መድሀኒአለም': 'Medhanialem',
  'ሴቶች': 'Setoch',
  'ሂልተን': 'Hilton',
  'እናት': 'Enat',
  'ማርቆስ': 'Markos',
  'ዳዊት': 'Dawit',
  'ራስ ደስታ': 'Ras Desta',
  'አርበኞች': 'Arbegnoch',
  'ሀግቤስ': 'Hagbes',
  'ጎጃም': 'Gojjam',
  'ጎጃም በረንዳ': 'Gojjam Berenda',
  'ጅንአድ': 'Jinad',
  'አበበች ጎበና': 'Abebech Gobena',
  'ዮሐንስ': 'Yohannes',
  'ሰን': 'Sun',
  'ጋቦን': 'Gabon',
  'ቻድ': 'Chad',
  'ስፖርት ኮሚሽን': 'Sport Commission',
  'ጨጨሆ': 'Checheho',
  'መሶብ': 'Mesob',
  'ሬድዋን': 'Redwan',
  'ሞኪንኮ': 'Mokinko',
  'ሰላም': 'Selam',
  'ኦሮሚያ ታወር': 'Oromia Tower',
  'ዮጎ ቸርች': 'Yogo Church',
  'ቀነኒሳ': 'Kenenisa',
  'ብርሀነ አደሬ': 'Berhane Adere',
  'አርመን': 'Armen',
  'ሞሞና': 'Momona',
  'ካሌብ': 'Kaleb',
  'ጌጃ': 'Geja',
  'ብሔራዊ': 'Biherawi',
  'ብሔራርዊ': 'Biherawi',
  'ቄጤማ ተራ': 'Ketema Tera',
  'ጳውሎስ': 'Pawlos',
  'ዳትሰን': 'Datsun',
  'ሳሚ': 'Sami',
  'ስካይ ላይት': 'Skylight',
  'ሚሊኒየም': 'Millennium',
  'አለም ሲኒማ': 'Alem Cinema',
  'ጁፒተር': 'Jupiter',
  'ቫርኔሮ': 'Varnero',
  'ሁጃድ ቻይና': 'Hujad China',
  'ድሬ': 'Dire',
  'ጉዳ': 'Guda',
  'ጉዮ': 'Guyo',
  'ቶልቻ': 'Tolcha',
  'ሰሪፊ': 'Serifi',
  'ጉጄ': 'Guje',
  'ፌስቱላ': 'Fistula',
  'ራሽያ': 'Russia',
  'ራሺያ': 'Russia',
  'እንግሊዝ': 'English',
  'ኬንያ': 'Kenya',
  'ሚናሮል': 'Minarol',
  'ቹቹ ሜዳ': 'Chuchu Meda',
  'ደረጄ': 'Dereje',
  'አርሴማ': 'Arsema',
  'ዳንሴ': 'Danse',
  'ጨለለቆ': 'Cheleleko',
  'አንቆርጫ': 'Ankorcha',
  'ወረዳ': 'Woreda',
  'ወታደር': 'Wetader',
  'ኪዳነ ምህረት': 'Kidane Mehret',
  'መሳለሚያ': 'Mesalemiya',
  'ዘርፌ ቦኖ': 'Zerfe Bono',
  'ፍናን ዶቦ': 'Finan Dabo',
  'ፍናን ዳቦ': 'Finan Dabo',
  'ቀርሳ': 'Qersa',
  'ወንድይራድ': 'Wondyirad',
  'ወንዲራድ': 'Wendrad',
  'ክህሎት ሚኒስቴር': 'Khilot Ministry',
  'ማዕድን ሚኒስቴር': 'Maeden Ministry',
  'ኢትዮ ቻይና': 'Ethio China',
  'አራራት': 'Ararat',
  'ሀይሌ ሪዞርት': 'Haile Resort',
  'እስራኤል': 'Israel',
  'ኖህ': 'Noah',
  'ወሰን': 'Wesen',
  'ጆርጅ ዘይት': 'George Zeyt',
  'ሰንሻይን': 'Sunshine',
  'ቴዲ አፍሮ': 'Teddy Afro',
  'ባድሜ': 'Badme',
  'ፒያሣ': 'Piazza',
  'ቸርቸል': 'Churchill',
  'ቸርቸል ጎዳና': 'Churchill Godana',
  'ጎላ ሚካኤል': 'Gola Mikael',
  'ተክለሃይማኖት ሆስፒታል': 'Tekle Haimanot Hospital',
  'ዋቢ ሽበሌ': 'Wabe Shebelle',
  'ዋቢ ሸበሌ': 'Wabe Shebelle',
  'ቴዎድሮስ አደባባይ': 'Tewodros Square',
  'ቴዎድሮስ': 'Tewodros',
  'ካቴድራል': 'Cathedral',
  'አድዋ ሙዚየም': 'Adwa Museum',
  'ሙዚየም': 'Museum',
  'ጣይቱ': 'Taitu',
  'ጣይቱ ሆቴል': 'Taitu Hotel',
  'ጣይቱ ሆተል': 'Taitu Hotel',
  'ጨርቆስ ማንዴላ': 'Cherkos Mandela',
  'ማንዴላ': 'Mandela',
  'ታቦት ማደሪያ': 'Tabot Maderiya',
  'አዳምስ': 'Adams',
  'አዳምስ ሆቴል': 'Adams Hotel',
  'አዳምስ ሆቴል ጀርባ': 'Adams Hotel Jerba',
  'ሲሳይ': 'Sisay',
  'ሲሳይ ሚዳ': 'Sisay Meda',
  'ሲሳይ ሜዳ': 'Sisay Meda',
  'ቅዱስ ቂርቆስ': 'Kidus Kirkos',
  'ድድ ማስጫ': 'Dde Mascha',
  'አዲስ ሴንተር': 'Addis Center',
  'አዲስ ሴንተር ሰብስቴሽን': 'Addis Center Substation',
  'በኬኬር': 'KK Care',
  'ላምሮት': 'Lamrot',
  'ላምሮት ሆቴል': 'Lamrot Hotel',
  'ኮካ ማከፋፈያ': 'Coca Makefafeya',
  'ፖፖላሬ': 'Popolare',
  'ፖፖላሬ መከላከያ ካምፕ': 'Popolare Defense Camp',
  'አልጋ ተራ': 'Alga Tera',
  'በአልጋ ተራ': 'Alga Tera',
  'ጨነቀ': 'Cheneke',
  'ጨነቀ ሱቅ': 'Cheneke Store',
  'አስታራ': 'Astara',
  'ጣሊያን ዳቦ': 'Italian Dabo',
  'ቴሌ ዳታ': 'Tele Data'
};

// Clean Amharic punctuation and helper characters
export function cleanAmharicItem(text: string): string {
  return text
    .replace(/[፣、፤,;።፦:·•]+/g, '')
    .trim();
}

// Phonetic fallback for Ethiopic Fidel syllables to Latin script
// Standard Ethiopian Latin phonetic mapping
const FIDEL_PHONETIC: Record<string, string> = {
  // 1st: e, 2nd: u, 3rd: i, 4th: a, 5th: e, 6th: consonant/e, 7th: o
  'ሀ': 'he', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
  'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo',
  'ሐ': 'he', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho',
  'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo',
  'ሠ': 'se', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so',
  'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro',
  'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so',
  'ሸ': 'she', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho',
  'ቀ': 'ke', 'ቁ': 'ku', 'ቂ': 'ki', 'ቃ': 'ka', 'ቄ': 'ke', 'ቅ': 'k', 'ቆ': 'ko',
  'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo',
  'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to',
  'ቸ': 'che', 'ቹ': 'chu', 'ቺ': 'chi', 'ቻ': 'cha', 'ቼ': 'che', 'ች': 'ch', 'ቾ': 'cho',
  'ኀ': 'he', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
  'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no',
  'ኘ': 'gne', 'ኙ': 'gnu', 'ኚ': 'gni', 'ኛ': 'gna', 'ኜ': 'gne', 'ኝ': 'gn', 'ኞ': 'gno',
  'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'e', 'ኦ': 'o',
  'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
  'ኸ': 'he', 'ኹ': 'hu', 'ኺ': 'hi', 'ኻ': 'ha', 'ኼ': 'he', 'ኽ': 'h', 'ኾ': 'ho',
  'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'wo',
  'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'e', 'ዖ': 'o',
  'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo',
  'ዠ': 'zhe', 'ዡ': 'zhu', 'ዢ': 'zhi', 'ዣ': 'zha', 'ዤ': 'zhe', 'ዥ': 'zh', 'ዦ': 'zho',
  'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ይ': 'y', 'ዮ': 'yo',
  'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do',
  'ጀ': 'je', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo',
  'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go',
  'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to',
  'ጨ': 'che', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho',
  'ጰ': 'pe', 'ጱ': 'pu', 'ጲ': 'pi', 'ጳ': 'pa', 'ጴ': 'pe', 'ጵ': 'p', 'ጶ': 'po',
  'ጸ': 'tse', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso',
  'ፀ': 'tse', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso',
  'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo',
  'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po',
  'ቨ': 've', 'ቩ': 'vu', 'ቪ': 'vi', 'ቫ': 'va', 'ቬ': 've', 'ቭ': 'v', 'ቮ': 'vo',

  // Labialized Diphthongs
  'ሏ': 'lwa', 'ሟ': 'mwa', 'ሯ': 'rwa', 'ሷ': 'swa', 'ሿ': 'shwa', 'ቧ': 'bwa',
  'ቷ': 'twa', 'ቿ': 'chwa', 'ኗ': 'nwa', 'ኟ': 'gnwa', 'ዟ': 'zwa', 'ዧ': 'zhwa',
  'ዷ': 'dwa', 'ጇ': 'jwa', 'ጧ': 'twa', 'ጯ': 'chwa', 'ጷ': 'pwa', 'ጿ': 'tswa', 'ፏ': 'fwa',
  'ቋ': 'kwa', 'ቈ': 'kwe', 'ቊ': 'kwi', 'ቌ': 'kwe', 'ቍ': 'kw',
  'ኳ': 'kwa', 'ኰ': 'kwe', 'ኲ': 'kwi', 'ኴ': 'kwe', 'ኵ': 'kw',
  'ጓ': 'gwa', 'ጐ': 'gwe', 'ጒ': 'gwi', 'ጔ': 'gwe', 'ጕ': 'gw',
  'ኋ': 'hwa', 'ኈ': 'hwe', 'ኊ': 'hwi', 'ኌ': 'hwe', 'ኍ': 'hw',

  // Ethiopic Numerals
  '፩': '1', '፪': '2', '፫': '3', '፬': '4', '፭': '5',
  '፮': '6', '፯': '7', '፰': '8', '፱': '9', '፲': '10',
  '፳': '20', '፴': '30', '፵': '40', '፶': '50', '፷': '60',
  '፸': '70', '፹': '80', '፺': '90', '፻': '100'
};

export function phoneticTransliterate(str: string): string {
  if (!str) return '';
  const clean = cleanAmharicItem(str);
  if (!clean) return '';

  let out = '';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (FIDEL_PHONETIC[char]) {
      // Special fix for 'ው' at beginning of word when followed by a consonant (e.g. ውስጥ -> wust)
      if (char === 'ው' && (i === 0 || i === 1) && clean.length > 2) {
        out += 'wu';
      } else {
        out += FIDEL_PHONETIC[char];
      }
    } else {
      out += char;
    }
  }

  if (out.length > 0) {
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Translates an Amharic location or sentence to natural Ethiopian Latin phonetics.
 * e.g. "ቤተ መንግስት ጊቡ ውስጥ በከፊል" -> "Bete Mengst Gibi Wust Bekefil"
 */
export function translateAmharicLocation(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  // Check if text already has English slash format: "Amharic / English"
  if (rawText.includes('/') && /[a-zA-Z]/.test(rawText)) {
    const parts = rawText.split('/');
    if (parts.length >= 2 && /[a-zA-Z]/.test(parts[1])) {
      return parts[1].trim();
    }
  }

  // Split by major punctuation separators (Ethiopic semicolon, comma, newlines, English delimiters)
  const rawSegments = rawText.split(/[፤\n\r]+/).filter(s => s.trim().length > 0);
  const finalSegments: string[] = [];

  for (const rawSeg of rawSegments) {
    // Within each segment, handle sub-clauses split by commas
    const subSegments = rawSeg.split(/[፣,]+/).filter(s => s.trim().length > 0);
    const subTranslated: string[] = [];

    for (const seg of subSegments) {
      let cleanSeg = seg.trim();
      if (!cleanSeg) continue;

      // If segment is already pure Latin/English
      if (!/[\u1200-\u137F]/.test(cleanSeg)) {
        subTranslated.push(cleanSeg);
        continue;
      }

      // Check full segment dictionary match
      const strippedFull = cleanAmharicItem(cleanSeg);
      if (AMHARIC_TO_ENGLISH_DICT[strippedFull]) {
        subTranslated.push(AMHARIC_TO_ENGLISH_DICT[strippedFull]);
        continue;
      }

      // Break segment into words and phrase match
      const words = cleanSeg.split(/\s+/).filter(w => w.trim().length > 0);
      const translatedWords: string[] = [];
      let i = 0;

      while (i < words.length) {
        // Try 4-word match
        if (i + 3 < words.length) {
          const four = `${cleanAmharicItem(words[i])} ${cleanAmharicItem(words[i+1])} ${cleanAmharicItem(words[i+2])} ${cleanAmharicItem(words[i+3])}`;
          if (AMHARIC_TO_ENGLISH_DICT[four]) {
            translatedWords.push(AMHARIC_TO_ENGLISH_DICT[four]);
            i += 4;
            continue;
          }
        }

        // Try 3-word match
        if (i + 2 < words.length) {
          const three = `${cleanAmharicItem(words[i])} ${cleanAmharicItem(words[i+1])} ${cleanAmharicItem(words[i+2])}`;
          if (AMHARIC_TO_ENGLISH_DICT[three]) {
            translatedWords.push(AMHARIC_TO_ENGLISH_DICT[three]);
            i += 3;
            continue;
          }
        }

        // Try 2-word match
        if (i + 1 < words.length) {
          const two = `${cleanAmharicItem(words[i])} ${cleanAmharicItem(words[i+1])}`;
          if (AMHARIC_TO_ENGLISH_DICT[two]) {
            translatedWords.push(AMHARIC_TO_ENGLISH_DICT[two]);
            i += 2;
            continue;
          }
        }

        // Try 1-word match
        const single = cleanAmharicItem(words[i]);
        if (AMHARIC_TO_ENGLISH_DICT[single]) {
          translatedWords.push(AMHARIC_TO_ENGLISH_DICT[single]);
          i += 1;
          continue;
        }

        // Check common Amharic prefixes: በ (Be-), ከ (Ke-), ወደ (Wede-), ለ (Le-)
        if (single.startsWith('በ') && single.length > 2 && AMHARIC_TO_ENGLISH_DICT[single.substring(1)]) {
          translatedWords.push(`Be ${AMHARIC_TO_ENGLISH_DICT[single.substring(1)]}`);
          i += 1;
          continue;
        }
        if (single.startsWith('ከ') && single.length > 2 && AMHARIC_TO_ENGLISH_DICT[single.substring(1)]) {
          translatedWords.push(`Ke ${AMHARIC_TO_ENGLISH_DICT[single.substring(1)]}`);
          i += 1;
          continue;
        }
        if (single.startsWith('ወደ') && single.length > 3 && AMHARIC_TO_ENGLISH_DICT[single.substring(2)]) {
          translatedWords.push(`Wede ${AMHARIC_TO_ENGLISH_DICT[single.substring(2)]}`);
          i += 1;
          continue;
        }
        if (single.startsWith('ለ') && single.length > 2 && AMHARIC_TO_ENGLISH_DICT[single.substring(1)]) {
          translatedWords.push(`Le ${AMHARIC_TO_ENGLISH_DICT[single.substring(1)]}`);
          i += 1;
          continue;
        }

        // Fallback: Fidel character transliteration
        const transliterated = phoneticTransliterate(words[i]);
        if (transliterated) {
          translatedWords.push(transliterated);
        }
        i += 1;
      }

      if (translatedWords.length > 0) {
        subTranslated.push(translatedWords.join(' '));
      }
    }

    if (subTranslated.length > 0) {
      finalSegments.push(subTranslated.join(', '));
    }
  }

  return finalSegments.join(', ');
}

/**
 * Returns formatted location representations based on the selected language mode ('en' | 'am').
 */
export function formatLocationDisplay(
  originalAmharic: string,
  mode: LanguageMode = 'en'
): {
  primary: string;
  secondary?: string;
  english: string;
  amharic: string;
} {
  const amharic = originalAmharic || '';
  const english = translateAmharicLocation(amharic);

  if (mode === 'am') {
    return {
      primary: amharic || english,
      secondary: undefined,
      english,
      amharic
    };
  }

  // English mode (default)
  return {
    primary: english || amharic,
    secondary: undefined,
    english,
    amharic
  };
}
