#!/usr/bin/env python3
"""Builds data/conflicts/ucdp-2025.json from Uppsala Conflict Data Program
version 26.1, year 2025 (Dyadic + Battle-Related Deaths dyadic, Non-State,
One-sided). Rows below are copied from those files; full names come from the
Uppsala Actor dataset 26.1. Re-run after editing: python3 scripts/conflicts/build-ucdp-2025.py
"""
import json, os

MINUSCA = ("Government of Bangladesh, Government of Bhutan, Government of Burkina Faso, Government of Burundi, "
  "Government of Cambodia (Kampuchea), Government of Cameroon, Government of China, Government of Congo, "
  "Government of Djibouti, Government of Egypt, Government of France, Government of Gambia, Government of Ghana, "
  "Government of Indonesia, Government of Ivory Coast, Government of Jordan, Government of Mali, Government of Mauritania, "
  "Government of Mongolia, Government of Morocco, Government of Nepal, Government of Niger, Government of Pakistan, "
  "Government of Peru, Government of Portugal, Government of Romania, Government of Russia (Soviet Union), "
  "Government of Rwanda, Government of Senegal, Government of Serbia (Yugoslavia), Government of Spain, "
  "Government of Sri Lanka, Government of Tanzania, Government of Togo, Government of Tunisia, Government of Turkey, "
  "Government of Vietnam (North Vietnam), Government of Zambia")

# type: S = state vs state, F = state vs group with foreign troops, G = state vs group,
#       N = group vs group, O = attacks on civilians
# [type, side A, side A allies, side B, side B allies, location, best, low, high, conflict id, dyad id]
ROWS = [
["S","Government of Russia (Soviet Union)","Government of North Korea","Government of Ukraine","","Russia (Soviet Union), Ukraine",94741,87321,140889,13243,14117],
["S","Government of Iran","","Government of Israel","Government of United States of America","Iran, Israel",1222,1094,1224,14609,15633],
["S","Government of United Kingdom, Government of United States of America","Government of Australia, Government of Bahrain, Government of Canada, Government of Netherlands, Government of New Zealand, Government of Norway, Government of Singapore, Government of Sri Lanka","Government of Yemen (North Yemen)","","United Kingdom, United States of America, Yemen (North Yemen)",781,337,1044,16099,17738],
["S","Government of Cambodia (Kampuchea)","","Government of Thailand","","Cambodia (Kampuchea), Thailand",252,249,442,294,634],
["S","Government of Afghanistan","","Government of Pakistan","","Afghanistan, Pakistan",178,86,426,11639,12291],
["S","Government of Israel","","Government of Yemen (North Yemen)","","Israel, Yemen (North Yemen)",164,94,197,16470,18195],
["S","Government of India","","Government of Pakistan","","India, Pakistan",67,64,94,218,422],
["S","Government of Israel","","Government of Syria","","Israel, Syria",35,35,35,302,649],
["F","Government of DR Congo (Zaire)","Government of Burundi, Government of Indonesia, Government of Kenya, Government of Malawi, Government of Nepal, Government of South Africa, Government of Tanzania","AFC","Government of Rwanda","DR Congo (Zaire)",4253,4086,21116,283,17740],
["F","Government of Somalia","Government of Djibouti, Government of Egypt, Government of Ethiopia, Government of Ghana, Government of Kenya, Government of Nigeria, Government of Sierra Leone, Government of Uganda, Government of United States of America, Government of Zambia","Al-Shabaab","","Somalia",2989,2963,3567,337,750],
["F","Government of Burkina Faso","Government of Niger","JNIM","","Burkina Faso",2939,2870,4367,360,15175],
["F","Government of Nigeria","Government of Cameroon, Government of Niger, Government of United States of America","IS","","Nigeria",1662,1489,1863,13641,14669],
["F","Government of Haiti","Government of Bahamas, Government of Belize, Government of El Salvador, Government of Guatemala, Government of Jamaica, Government of Kenya","Viv Ansanm","","Haiti",1211,1113,1336,381,17970],
["F","Government of Mali","Government of Russia (Soviet Union)","JNIM","","Mali",1086,1043,1455,11347,15108],
["F","Government of Niger","Government of Burkina Faso, Government of Mali, Government of Nigeria","IS","","Niger",535,521,641,13639,14668],
["F","Government of Ethiopia","Government of Kenya","OLA","","Ethiopia",477,421,4420,413,16240],
["F","Government of Yemen (North Yemen)","","Forces of the Presidential Leadership Council","Government of Bahrain, Government of Saudi Arabia, Government of United Arab Emirates","Yemen (North Yemen)",444,405,450,230,14595],
["F","Government of Mozambique","Government of Rwanda, Government of Tanzania","IS","","Mozambique",245,164,285,14845,16022],
["F","Government of Nigeria","Government of Chad, Government of Niger","JAS","","Nigeria",195,148,220,297,640],
["F","Government of Mali","Government of Burkina Faso, Government of Niger, Government of Russia (Soviet Union)","IS","","Mali",189,188,236,14113,15259],
["F","Government of Syria","Government of Turkey","SDF","","Syria",171,170,193,13809,14784],
["F","Government of Somalia","Government of United States of America","IS","","Somalia",106,72,106,14197,15077],
["F","Government of Burkina Faso","Government of Mali, Government of Niger","IS","","Burkina Faso",92,92,124,13840,14953],
["F","Government of Central African Republic",MINUSCA,"CPC-F","","Central African Republic",91,91,91,416,18304],
["F","Government of Mali","Government of Russia (Soviet Union)","FLA","","Mali",82,81,144,16038,17666],
["F","Government of Iraq","Government of France, Government of United Kingdom, Government of United States of America","IS","","Iraq",77,75,85,259,524],
["F","Government of Cameroon","Government of Nigeria","IS","","Cameroon",62,62,77,13638,14666],
["F","Government of Central African Republic",MINUSCA,"CPC","","Central African Republic",55,51,57,416,16562],
["F","Government of Central African Republic",MINUSCA,"CMSPR","","Central African Republic",51,51,65,416,18287],
["F","Government of Cameroon","Government of Chad","JAS","","Cameroon",45,32,53,353,12422],
["F","Government of DR Congo (Zaire)","Government of Indonesia, Government of Kenya, Government of Nepal, Government of South Africa, Government of Tanzania, Government of Uganda","IS","","DR Congo (Zaire)",36,32,106,14692,15998],
["F","Government of Syria","Government of United States of America","IS","","Syria",29,29,29,13604,14620],
["G","Government of Israel","","Hamas","","Israel",14127,13523,14796,234,477],
["G","Government of Sudan","","SFA","","Sudan",10253,9754,10595,309,18621],
["G","Government of Ethiopia","","Fano","","Ethiopia",3835,2275,12282,16069,17147],
["G","Government of Pakistan","","TTP","","Pakistan",2268,2213,2386,404,857],
["G","Government of Sudan","","RSF","","Sudan",1936,1884,1986,309,17497],
["G","Government of Myanmar (Burma)","","NUG","","Myanmar (Burma)",1101,1097,1740,222,16759],
["G","Government of Pakistan","","BRAS","","Pakistan",526,475,1815,325,16177],
["G","Government of Syria","","Military Council for the Liberation of Syria","","Syria",500,500,500,299,18395],
["G","Government of India","","CPI-Maoist","","India",417,415,430,227,453],
["G","Government of Israel","","Hezbollah","","Israel",337,337,339,426,891],
["G","Government of Myanmar (Burma)","","ULA","","Myanmar (Burma)",286,286,321,223,11387],
["G","Government of South Sudan","","SPLM/A - IO","","South Sudan",282,277,446,11345,12413],
["G","Government of Myanmar (Burma)","","PSLF","","Myanmar (Burma)",252,252,252,222,14273],
["G","Government of Myanmar (Burma)","","KIO","","Myanmar (Burma)",220,190,253,231,461],
["G","Government of Israel","","PIJ","","Israel",211,209,218,234,478],
["G","Government of Pakistan","","IMP","","Pakistan",194,181,328,404,18458],
["G","Government of DR Congo (Zaire)","","CRP","","DR Congo (Zaire)",175,167,181,283,18485],
["G","Government of Niger","","JNIM","","Niger",167,153,198,430,15174],
["G","Government of Colombia","","FARC-EMC","","Colombia",155,140,185,289,17247],
["G","Government of Myanmar (Burma)","","KNU","","Myanmar (Burma)",151,151,320,221,428],
["G","Government of Benin","","JNIM","","Benin",149,140,193,15256,16685],
["G","Government of Philippines","","CPP","","Philippines",141,135,141,209,411],
["G","Government of Cameroon","","Ambazonia insurgents","","Cameroon",133,130,136,14129,15895],
["G","Government of Indonesia","","OPM","","Indonesia",104,74,132,291,628],
["G","Government of Colombia","","ELN","","Colombia",98,95,99,289,624],
["G","Government of India","","Kashmir insurgents","","India",93,87,158,364,792],
["G","Government of Sudan","","SPLM/A-North","","Sudan",80,80,80,309,11975],
["G","Government of Myanmar (Burma)","","KNPP","","Myanmar (Burma)",73,73,93,253,511],
["G","Government of Israel","","Palestinian Mujahideen Movement","","Israel",70,63,70,234,18806],
["G","Government of Togo","","JNIM","","Togo",69,18,69,358,16955],
["G","Government of Rwanda","","FDLR-FOCA","","Rwanda",60,12,84,374,12102],
["G","Government of Afghanistan","","IS","","Afghanistan",56,27,85,13637,14320],
["G","Government of Turkey","","PKK","","Turkey",55,52,90,354,781],
["G","Government of Pakistan","","IS","","Pakistan",54,51,54,13936,14319],
["G","Government of Iran","","Jaish al-Adl","","Iran",52,44,65,338,12556],
["G","Government of Mozambique","","Naparama","","Mozambique",51,34,64,332,18188],
["G","Government of Pakistan","","HGB","","Pakistan",49,43,49,404,12287],
["G","Government of Nigeria","","IPOB","","Nigeria",48,30,67,303,14636],
["G","Government of Colombia","","EMBF","","Colombia",45,44,46,289,18128],
["G","Government of Kenya","","Al-Shabaab","","Kenya",44,43,94,13646,10589],
["G","Government of Thailand","","Patani insurgents","","Thailand",36,19,37,423,888],
["G","Government of India","","UNLFW","","India",27,27,27,13653,14685],
["G","Government of Israel","","PRC","","Israel",26,23,26,234,481],
["G","Government of Angola","","FLEC-FAC-TN","","Angola",25,5,95,387,15993],
["G","Government of Yemen (North Yemen)","","STC","","Yemen (North Yemen)",25,20,25,402,16617],
["G","Government of Afghanistan","","NRF","","Afghanistan",25,11,109,333,16825],
["N","Jalisco Cartel New Generation","","Santa Rosa de Lima Cartel","","Mexico",1489,429,1489,14532,15809],
["N","Sinaloa Cartel - Los Chapitos","","Sinaloa Cartel - Los Mayos","","Mexico",1095,797,1216,15082,16465],
["N","Juarez Cartel","","Sinaloa Cartel","","Mexico",1075,352,1076,4652,5262],
["N","Jalisco Cartel New Generation","","Sinaloa Cartel","","Guatemala, Mexico",996,127,1051,13737,14799],
["N","Carteles Unidos","","Jalisco Cartel New Generation, Los Blancos de Troya, Los de la Virgen, Los Viagras","","Mexico",780,203,780,16498,18331],
["N","Puntland State of Somalia","","IS","","Somalia",774,771,844,16734,18661],
["N","AFC","","VDP","","DR Congo (Zaire)",769,733,3645,16179,17833],
["N","Jalisco Cartel New Generation, Sinaloa Cartel - Los Chapitos","","Sinaloa Cartel - Los Mayos","","Mexico",692,325,692,16799,18749],
["N","Jalisco Cartel New Generation","","La Barredora","","Mexico",661,104,661,16447,18269],
["N","Caborca Cartel, Sinaloa Cartel - Los Mayos","","Sinaloa Cartel - Los Chapitos","","Mexico",468,19,468,15243,16672],
["N","Fulani","","Tiv","","Nigeria",388,276,449,4973,5583],
["N","Cartel Independiente de Acapulco","","Los Rusos","","Mexico",372,185,373,16392,18190],
["N","SNA","","SDF","","Syria",345,345,355,14803,16135],
["N","IS","","JAS","","Nigeria",333,331,363,13884,15023],
["N","Los Choneros","","Los Lobos","","Ecuador",288,201,412,15386,16872],
["N","Luac Jang Dinka, Pan-Juaj Dinka","","Jalwau Dinka","","South Sudan",226,226,226,16670,18565],
["N","Southern Tribes Gathering, Syrian Council of Tribes and Clans","","Suwayda Military Council","","Syria",194,194,194,16895,18856],
["N","Comando Vermelho","","PCC","","Brazil",188,118,195,13972,15142],
["N","Anuak","","Nuer","","Ethiopia",159,159,159,4582,5192],
["N","IS","","JNIM","","Burkina Faso, Mali",154,149,238,14864,16207],
["N","SLFA, SLM/A","","RSF","","Sudan",120,120,120,16792,18741],
["N","Birom","","Fulani","","Nigeria",118,113,121,4948,5558],
["N","IS","","SDF","","Syria",115,114,115,13616,14637],
["N","Forces of the Presidential Leadership Council","","STC","","Yemen (North Yemen)",109,67,109,14623,15915],
["N","AFNF","","AFPO","","Ethiopia",105,105,106,16626,18507],
["N","Dan na Ambassagou","","JNIM","","Mali",89,89,89,14622,15914],
["N","AQAP","","Forces of the Presidential Leadership Council","","Yemen (North Yemen)",87,59,89,13587,14596],
["N","Forces of Tony Peña","","Los Hondureños","","Costa Rica",84,2,91,16190,17872],
["N","Fulani","","Ron-Kulere","","Nigeria",82,82,85,13904,15051],
["N","Fulani","","Irigwe","","Nigeria",78,78,80,14083,15214],
["N","Los Ardillos","","Los Tlacos","","Mexico",76,66,78,15453,16953],
["N","Southern Tribes Gathering","","Suwayda Military Council","","Syria",75,75,75,16893,18854],
["N","Bonde dos 40","","PCC","","Brazil",70,70,70,15843,17429],
["N","EGC","","La Terraza","","Colombia",70,52,76,16660,18547],
["N","Farmers (CAR)","","Herders (CAR)","","Central African Republic",69,69,78,13689,14736],
["N","Fulani","","Ngambay","","Chad",69,68,70,16607,18479],
["N","Kusasi","","Mamprusi","","Ghana",67,34,73,4658,5268],
["N","Black Axe","","Eyie","","Nigeria",67,63,74,10823,11433],
["N","Farmers (Nigeria)","","Herders (Nigeria)","","Nigeria",64,64,71,13876,15013],
["N","Dozos (Mali)","","JNIM","","Mali",62,62,74,13988,15162],
["N","Forces of Churro","","Los Gemelos","","Costa Rica",58,32,67,16821,18776],
["N","ELN","","EMBF","","Colombia",57,51,119,16350,18127],
["N","Los Costenos","","Los Pepes","","Colombia",55,43,75,16082,17722],
["N","PCC","","Sindicato do Crime","","Brazil",54,47,55,14224,15409],
["N","FARC-EMC","","ELN","","Colombia",53,53,55,15700,17253],
["N","Fulani","","Idoma","","Nigeria",51,35,55,11676,12342],
["N","Comando Vermelho","","Família Terror Amapá","","Brazil",51,49,51,16898,18858],
["N","GDE, PCC","","Sindicato do Crime","","Brazil",50,50,52,15517,17026],
["N","Fulani","","Munga","","Nigeria",49,49,52,16845,18803],
["N","Dassanetch","","Turkana","","Ethiopia, Kenya",45,43,48,4672,5282],
["N","Chain Guys","","Full Force","","Nigeria",45,33,45,16124,17769],
["N","Bonde dos 40","","Comando Vermelho","","Brazil",44,36,44,15842,17428],
["N","Jalisco Cartel New Generation","","Gulf Cartel - Grupo Sombra faction","","Mexico",43,6,43,16520,18354],
["N","Fulani","","Mushere","","Nigeria",42,40,44,16796,18745],
["N","Bor Dinka","","Acholi, Murle","","South Sudan",41,41,41,16529,18365],
["N","HTA","","STC","","Yemen (North Yemen)",41,39,41,16749,18685],
["N","Black Axe","","SVC","","Nigeria, South Africa",36,29,39,10825,11435],
["N","EGC","","ELN","","Colombia",35,31,70,14485,15750],
["N","Bonde dos 13, PCC","","Comando Vermelho","","Bolivia, Brazil",35,30,37,15614,17152],
["N","Los Tiguerones Fenix faction","","Los Tiguerones Igualitos faction","","Ecuador",34,34,34,16505,18339],
["N","Gawaar Nuer","","Lou Nuer","","South Sudan",33,21,33,15828,17412],
["N","Bulala","","Kreda","","Chad",33,33,33,16757,18694],
["N","Comando Vermelho","","Terceiro Comando Puro","","Brazil",32,32,32,11934,12693],
["N","URDPC","","Zaire self-defense group","","DR Congo (Zaire)",32,31,33,15029,16402],
["N","Los Lobos","","Los Lobos Box","","Ecuador",31,31,32,16255,17958],
["N","FARC-EMC","","EMBF","","Colombia",31,31,32,16339,18114],
["N","Birifor","","Gonja","","Ghana",31,31,31,16666,18554],
["N","Yakuman tribe","","Yangukim tribe","","Papua New Guinea",31,31,31,16756,18693],
["N","EGC","","Autodefensas Conquistadoras de la Sierra Nevada","","Colombia",29,28,33,16044,17674],
["N","Agatu","","Fulani","","Nigeria",28,13,28,11675,12341],
["N","Jalisco Cartel New Generation, Sangre Nueva Zeta","","Los Rojos","","Mexico",28,28,28,15708,17267],
["N","Murle","","Toposa","","South Sudan",27,13,27,16216,17908],
["N","Hausa","","Fulani","","Nigeria",26,20,29,9341,9951],
["N","AQAP","","STC","","Yemen (North Yemen)",25,17,25,14740,16059],
["N","IS","","Naparama","","Mozambique",25,19,28,15756,17327],
["O","SFA","","","","Sudan",61973,8288,77011,16712,18623],
["O","IS","","","","Afghanistan, Burkina Faso, Cameroon, DR Congo (Zaire), Iraq, Mali, Mozambique, Niger, Nigeria, Pakistan, Philippines, Syria",2399,2302,2506,506,973],
["O","Government of Syria","","","","Syria",1721,1415,1993,711,1178],
["O","AFC","","","","DR Congo (Zaire)",1390,1070,1583,16101,17741],
["O","Government of Tanzania","","","","Tanzania",1009,408,2692,470,937],
["O","Viv Ansanm","","","","Haiti",960,923,972,16265,17971],
["O","Government of Burkina Faso","","","","Burkina Faso, Mali",784,784,863,695,1162],
["O","JNIM","","","","Benin, Burkina Faso, Mali, Niger",592,590,875,13968,15136],
["O","Government of Ethiopia","","","","Ethiopia",574,111,625,474,941],
["O","Government of Sudan","","","","Sudan",437,389,437,480,947],
["O","URDPC","","","","DR Congo (Zaire)",425,398,427,14745,16065],
["O","JAS","","","","Cameroon, Chad, Nigeria",389,293,496,1850,2332],
["O","RSF","","","","Sudan",358,358,591,15913,17514],
["O","Government of Mali, Government of Russia (Soviet Union)","","","","Mali",322,299,371,16369,18152],
["O","Military Council for the Liberation of Syria","","","","Syria",211,211,211,16564,18425],
["O","Government of Myanmar (Burma)","","","","Myanmar (Burma)",207,204,211,488,955],
["O","Government of DR Congo (Zaire)","","","","DR Congo (Zaire)",187,71,193,467,934],
["O","VDP","","","","DR Congo (Zaire)",186,75,310,16066,17706],
["O","Gran Grif","","","","Haiti",175,174,177,15163,16572],
["O","Fano","","","","Ethiopia",160,102,181,15364,16832],
["O","BRAS","","","","Pakistan",158,39,158,14859,16202],
["O","EGC","","","","Colombia",110,50,127,14486,15751],
["O","Government of Mali","","","","Mali",109,88,132,454,921],
["O","Government of Russia (Soviet Union)","","","","Central African Republic, Mali, Russia (Soviet Union), Sudan, Ukraine",106,89,108,453,920],
["O","Government of Mozambique","","","","Mozambique",96,77,190,700,1167],
["O","Government of Israel","","","","Israel",91,89,93,483,950],
["O","OLA","","","","Ethiopia",90,90,90,14893,16241],
["O","ELN","","","","Colombia",81,60,92,606,1073],
["O","FARC-EMC","","","","Colombia",74,61,82,15697,17248],
["O","Comando Vermelho","","","","Brazil",68,42,72,1222,1702],
["O","Mobondo","","","","DR Congo (Zaire)",68,58,71,15893,17488],
["O","Government of Burundi","","","","Burundi",62,53,63,471,938],
["O","Forces of Bello Turji","","","","Nigeria",61,48,61,16382,18174],
["O","La Coalition","","","","Haiti",55,55,55,16592,18460],
["O","Government of Rwanda","","","","DR Congo (Zaire)",54,54,267,472,939],
["O","Forces of Barbaru","","","","Nigeria",53,53,53,16373,18158],
["O","IPOB","","","","Nigeria",50,0,101,13903,15050],
["O","Government of Yemen (North Yemen)","","","","Yemen (North Yemen)",46,12,51,715,1182],
["O","Los Monos","","","","Argentina",45,45,45,16775,18716],
["O","Ambazonia insurgents","","","","Cameroon",44,34,47,14605,15896],
["O","Kashmir insurgents","","","","India",43,41,43,522,989],
["O","Government of Pakistan","","","","Afghanistan, Pakistan",39,39,56,730,1197],
["O","CPI-Maoist","","","","India",38,36,42,499,966],
["O","Sinaloa Cartel","","","","Mexico",37,24,41,1224,1704],
["O","Forces of Dan Saadiya","","","","Nigeria",37,37,57,16625,18506],
["O","Saraya Ansar al-Sunna","","","","Syria",35,35,35,16813,18768],
["O","AAKG","","","","Central African Republic",30,30,30,16103,17744],
["O","Jalisco Cartel New Generation","","","","Mexico",28,13,28,1943,2425],
["O","Government of Afghanistan","","","","Afghanistan, Iran",27,18,54,484,951],
["O","Autodefensas Conquistadoras de la Sierra Nevada","","","","Colombia",27,17,30,15189,16604],
["O","Kokorat sans ras","","","","Haiti",27,26,27,16085,17725],
["O","Full Force","","","","Nigeria",27,27,27,16885,18846],
["O","Zaire self-defense group","","","","DR Congo (Zaire)",26,23,30,15044,16419],
["O","Los Costenos","","","","Colombia",26,25,28,16154,17805],
["O","Lakurawa","","","","Niger, Nigeria",26,24,28,16371,18156],
]

FULL = {
"AFC":"Congo River Alliance (AFC)","JNIM":"Group for the Support of Islam and Muslims (JNIM)","IS":"Islamic State (IS)",
"OLA":"Oromo Liberation Army (OLA)","JAS":"Jama'atu Ahlis Sunna Lidda'awati wal-Jihad, known as Boko Haram (JAS)",
"SDF":"Syrian Democratic Forces (SDF)","CPC-F":"Coalition for Fundamental Change (CPC-F)","CPC":"Coalition of Patriots for Change (CPC)",
"CMSPR":"Military Coalition for People's Salvation and Recovery (CMSPR)","FLA":"Azawad Liberation Front (FLA)",
"SFA":"Sudan Founding Alliance, which includes the Rapid Support Forces (SFA)","RSF":"Rapid Support Forces (RSF)",
"NUG":"National Unity Government (NUG)","TTP":"Taliban Movement of Pakistan (TTP)","BRAS":"Baloch National Freedom Movement (BRAS)",
"CPI-Maoist":"Communist Party of India (Maoist)","ULA":"United League of Arakan (ULA)",
"SPLM/A - IO":"Sudan People's Liberation Movement/Army in Opposition (SPLM/A-IO)","PSLF":"Palaung State Liberation Front (PSLF)",
"KIO":"Kachin Independence Organization (KIO)","PIJ":"Palestinian Islamic Jihad (PIJ)","IMP":"Ittihad-ul-Mujahideen Pakistan (IMP)",
"CRP":"Convention for the Popular Revolution (CRP)","FARC-EMC":"Revolutionary Armed Forces of Colombia, Central General Staff (FARC-EMC)",
"KNU":"Karen National Union (KNU)","CPP":"Communist Party of the Philippines (CPP)","OPM":"Organization for a Free Papua (OPM)",
"ELN":"National Liberation Army (ELN)","SPLM/A-North":"Sudan People's Liberation Movement/Army-North (SPLM/A-North)",
"KNPP":"Karenni National Progressive Party (KNPP)","FDLR-FOCA":"Democratic Forces for the Liberation of Rwanda, Abacunguzi Fighting Forces (FDLR-FOCA)",
"PKK":"Kurdistan Workers' Party (PKK)","HGB":"Forces of Hafiz Gul Bahadur (HGB)","IPOB":"Indigenous People of Biafra (IPOB)",
"EMBF":"General Staff of the Blocs and Front (EMBF)","UNLFW":"United Liberation Front of Western South East Asia (UNLFW)",
"PRC":"Popular Resistance Committees (PRC)","FLEC-FAC-TN":"Front for the Liberation of the Enclave of Cabinda, Armed Forces of Cabinda, Tiago Nzita faction (FLEC-FAC-TN)",
"STC":"Southern Transitional Council (STC)","NRF":"National Resistance Front of Afghanistan (NRF)","SNA":"Syrian National Army (SNA)",
"PCC":"First Capital Command (PCC)","AFNF":"Amhara Fano National Force (AFNF)","AFPO":"Amhara Fano Popular Organization (AFPO)",
"AQAP":"al-Qaida in the Arabian Peninsula (AQAP)","EGC":"Gaitanista Army of Colombia (EGC)","SVC":"Supreme Viking Confraternity (SVC)",
"HTA":"Hadhramaut Tribal Alliance (HTA)","URDPC":"Union of Revolutionaries for the Defense of the Congolese People (URDPC)",
"VDP":"Patriotic Defence Volunteers (VDP)","AAKG":"Azande Ani Kpi Gbe (AAKG)","SLM/A":"Sudan Liberation Movement/Army (SLM/A)",
"SLFA":"Sudan Liberation Force Alliance (SLFA)","GDE":"Guardians of the State (GDE)",
"Farmers (CAR)":"Farmers (Central African Republic)","Herders (CAR)":"Herders (Central African Republic)",
}

ISO = {
"Afghanistan":"AFG","Angola":"AGO","Argentina":"ARG","Australia":"AUS","Bahamas":"BHS","Bahrain":"BHR","Bangladesh":"BGD",
"Belize":"BLZ","Benin":"BEN","Bhutan":"BTN","Bolivia":"BOL","Brazil":"BRA","Burkina Faso":"BFA","Burundi":"BDI",
"Cambodia (Kampuchea)":"KHM","Cameroon":"CMR","Canada":"CAN","Central African Republic":"CAF","Chad":"TCD","China":"CHN",
"Colombia":"COL","Congo":"COG","Costa Rica":"CRI","DR Congo (Zaire)":"COD","Djibouti":"DJI","Ecuador":"ECU","Egypt":"EGY",
"El Salvador":"SLV","Ethiopia":"ETH","France":"FRA","Gambia":"GMB","Ghana":"GHA","Guatemala":"GTM","Haiti":"HTI","India":"IND",
"Indonesia":"IDN","Iran":"IRN","Iraq":"IRQ","Israel":"ISR","Ivory Coast":"CIV","Jamaica":"JAM","Jordan":"JOR","Kenya":"KEN",
"Malawi":"MWI","Mali":"MLI","Mauritania":"MRT","Mexico":"MEX","Mongolia":"MNG","Morocco":"MAR","Mozambique":"MOZ",
"Myanmar (Burma)":"MMR","Nepal":"NPL","Netherlands":"NLD","New Zealand":"NZL","Niger":"NER","Nigeria":"NGA",
"North Korea":"PRK","Norway":"NOR","Pakistan":"PAK","Papua New Guinea":"PNG","Peru":"PER","Philippines":"PHL",
"Portugal":"PRT","Romania":"ROU","Russia (Soviet Union)":"RUS","Rwanda":"RWA","Saudi Arabia":"SAU","Senegal":"SEN",
"Serbia (Yugoslavia)":"SRB","Sierra Leone":"SLE","Singapore":"SGP","Somalia":"SOM","South Africa":"ZAF","South Sudan":"SSD",
"Spain":"ESP","Sri Lanka":"LKA","Sudan":"SDN","Syria":"SYR","Tanzania":"TZA","Thailand":"THA","Togo":"TGO","Tunisia":"TUN",
"Turkey":"TUR","Uganda":"UGA","Ukraine":"UKR","United Arab Emirates":"ARE","United Kingdom":"GBR",
"United States of America":"USA","Vietnam (North Vietnam)":"VNM","Yemen (North Yemen)":"YEM","Zambia":"ZMB",
}

TYPES = {"S":"State vs state","F":"State vs armed group, foreign troops involved","G":"State vs armed group",
         "N":"Armed group vs armed group","O":"Attacks on civilians"}

def split(s): return [x.strip() for x in s.split(",") if x.strip()] if s else []
def full(s):
    if s in FULL: return FULL[s]
    return ", ".join(FULL.get(p, p) for p in split(s)) if s else ""
def govs(s):
    out = []
    for p in split(s):
        if p.startswith("Government of "):
            name = p[len("Government of "):]
            if name not in ISO: raise SystemExit("no ISO for " + name)
            out.append(ISO[name])
    return out

rows = []
for t, a, a2, b, b2, loc, best, low, high, cid, did in ROWS:
    locs = []
    for p in split(loc):
        if p not in ISO: raise SystemExit("no ISO for location " + p)
        locs.append(ISO[p])
    rows.append({
        "type": TYPES[t], "side_a": full(a), "side_a_allies": a2, "side_b": full(b) or ("Civilians" if t == "O" else ""),
        "side_b_allies": b2, "location": loc.replace("DR Congo", "Democratic Republic of the Congo"), "location_iso3": locs,
        "states_involved_iso3": sorted(set(govs(a) + govs(a2) + govs(b) + govs(b2))),
        "deaths_best": best, "deaths_low": low, "deaths_high": high,
        "war": t in "SFG" and None or None, "conflict_id": cid, "dyad_id": did,
    })
# Uppsala calls a state-based conflict a war at 1,000+ battle deaths in the year, summed over its pairs.
by_conf = {}
for r in rows:
    if r["type"].startswith("State"): by_conf[r["conflict_id"]] = by_conf.get(r["conflict_id"], 0) + r["deaths_best"]
for r in rows:
    r["war"] = r["type"].startswith("State") and by_conf[r["conflict_id"]] >= 1000

out = {
  "source": "Uppsala Conflict Data Program, Uppsala University, datasets version 26.1, year 2025: Dyadic + Battle-Related Deaths (dyadic), Non-State Conflict, One-sided Violence. https://ucdp.uu.se/downloads/ Licence CC BY 4.0. Full names from the UCDP Actor dataset 26.1.",
  "year": 2025, "retrieved": "2026-11-24",
  "notes": "One row per fighting pair (dyad). location_iso3 is where the fighting took place; states_involved_iso3 lists every government named on either side, including allies with troops in the fight. 'Government of Yemen (North Yemen)' is the Sanaa authority (Ansar Allah); the Aden government is 'Forces of the Presidential Leadership Council'.",
  "totals": {
    "state_conflicts": len({r["conflict_id"] for r in rows if r["type"].startswith("State")}),
    "interstate_conflicts": len({r["conflict_id"] for r in rows if r["type"] == "State vs state"}),
    "wars": len({r["conflict_id"] for r in rows if r["war"]}),
    "nonstate_conflicts": sum(1 for r in rows if r["type"] == "Armed group vs armed group"),
    "deaths_best": sum(r["deaths_best"] for r in rows),
  },
  "rows": rows,
}
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, "..", "..", "data", "conflicts", "ucdp-2025.json")
os.makedirs(os.path.dirname(path), exist_ok=True)
json.dump(out, open(path, "w"), ensure_ascii=False, indent=1)
print(json.dumps(out["totals"]), len(rows), "rows")
