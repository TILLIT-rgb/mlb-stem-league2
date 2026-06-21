const OUTCOME_KEYS = ['1B','2B','3B','HR','BB','HBP','SO','FO','GO'];
const OUTCOME_LABELS = ['Single','Double','Triple','Home Run','Walk','Hit By Pitch','Strikeout','Fly Out','Ground Out'];

function genDeg(ba, obp, slg) {
  const hbpR = 0.008;
  const bbR = Math.max(0.02, (obp - ba) / (1 - ba) - hbpR);
  const abR = 1 - bbR - hbpR;
  const hitR = ba * abR;
  const tbR = slg * abR;
  const xb = (tbR - hitR) * 360;
  let hr = Math.round(xb / 5.2);
  let trip = Math.max(0, Math.round(hr * 0.1));
  let dbl = Math.round(xb - 2 * trip - 3 * hr);
  if (dbl < 0) dbl = 0;
  let sin = Math.round(hitR * 360) - dbl - trip - hr;
  if (sin < 0) sin = 0;
  let bb = Math.round(bbR * 360);
  let hbp = Math.round(hbpR * 360);
  let so = Math.round((0.20 + (0.260 - ba) * 0.3) * 360);
  if (so < 20) so = 20;
  let rem = 360 - sin - dbl - trip - hr - bb - hbp - so;
  if (rem < 0) { so += rem; rem = 0; if (so < 10) { so = 10; rem = 360 - sin - dbl - trip - hr - bb - hbp - so; } }
  let go = Math.round(rem * 0.56);
  let fo = rem - go;
  if (fo < 0) { fo = 0; go = rem; }
  return [sin, dbl, trip, hr, bb, hbp, so, fo, go];
}

const BATTERS = [
  {n:"William Contreras",p:["C"],ba:.260,obp:.355,slg:.399,deg:[56,15,0,9,46,3,66,72,93]},
  {n:"Seiya Suzuki",p:["OF","DH"],ba:.245,obp:.326,slg:.478},
  {n:"Jacob Wilson",p:["SS"],ba:.311,obp:.355,slg:.444},
  {n:"Isaac Collins",p:["OF","2B"],ba:.263,obp:.368,slg:.411},
  {n:"Corbin Carroll",p:["OF"],ba:.259,obp:.343,slg:.541},
  {n:"Mike Trout",p:["DH","OF"],ba:.232,obp:.359,slg:.439},
  {n:"Hunter Goodman",p:["C","DH"],ba:.278,obp:.323,slg:.520},
  {n:"Zach Neto",p:["SS"],ba:.257,obp:.319,slg:.474},
  {n:"Jazz Chisholm Jr.",p:["2B"],ba:.242,obp:.332,slg:.481},
  {n:"Mookie Betts",p:["SS","OF"],ba:.258,obp:.326,slg:.406},
  {n:"Julio Rodriguez",p:["OF"],ba:.267,obp:.324,slg:.474},
  {n:"Salvador Perez",p:["C","1B"],ba:.236,obp:.284,slg:.446},
  {n:"Ketel Marte",p:["3B","2B","DH"],ba:.283,obp:.376,slg:.517},
  {n:"Curtis Mead",p:["2B","3B"],ba:.233,obp:.299,slg:.321},
  {n:"Kyle Stowers",p:["OF"],ba:.288,obp:.368,slg:.544},
  {n:"Adley Rutschman",p:["C","DH"],ba:.220,obp:.307,slg:.366},
  {n:"CJ Abrams",p:["SS"],ba:.257,obp:.315,slg:.433},
  {n:"Matt Olson",p:["1B"],ba:.272,obp:.366,slg:.484},
  {n:"Isaac Paredes",p:["3B"],ba:.254,obp:.352,slg:.458},
  {n:"Ronald Acuna Jr.",p:["OF"],ba:.250,obp:.360,slg:.500},
  {n:"Alejandro Kirk",p:["C"],ba:.265,obp:.340,slg:.380},
  {n:"Marcus Semien",p:["2B","SS"],ba:.272,obp:.340,slg:.470},
  {n:"Elly De La Cruz",p:["SS"],ba:.240,obp:.300,slg:.480},
  {n:"Isiah Kiner-Falefa",p:["3B","SS"],ba:.275,obp:.320,slg:.370},
  {n:"Bryce Harper",p:["1B","DH"],ba:.285,obp:.380,slg:.530},
  {n:"Willson Contreras",p:["C","DH"],ba:.260,obp:.345,slg:.450},
  {n:"Steven Kwan",p:["OF"],ba:.295,obp:.370,slg:.420},
  {n:"James Wood",p:["OF"],ba:.250,obp:.330,slg:.440},
  {n:"Logan O'Hoppe",p:["C"],ba:.244,obp:.310,slg:.420},
  {n:"Josh Jung",p:["3B"],ba:.262,obp:.320,slg:.480},
  {n:"Alex Call",p:["OF"],ba:.230,obp:.340,slg:.350},
  {n:"Cal Raleigh",p:["C"],ba:.232,obp:.310,slg:.480},
  {n:"Vladimir Guerrero Jr.",p:["1B"],ba:.290,obp:.370,slg:.530},
  {n:"Junior Caminero",p:["3B","SS"],ba:.260,obp:.310,slg:.440},
  {n:"Pete Crow-Armstrong",p:["OF"],ba:.240,obp:.300,slg:.400},
  {n:"Pete Alonso",p:["1B"],ba:.240,obp:.330,slg:.490},
  {n:"Corey Seager",p:["SS"],ba:.275,obp:.350,slg:.500},
  {n:"Edmundo Sosa",p:["SS","2B","3B"],ba:.255,obp:.300,slg:.380},
  {n:"Roman Anthony",p:["OF"],ba:.260,obp:.350,slg:.450},
  {n:"Aaron Judge",p:["OF","DH"],ba:.270,obp:.390,slg:.570},
  {n:"Jackson Chourio",p:["OF"],ba:.255,obp:.310,slg:.440},
  {n:"Willy Adames",p:["SS"],ba:.260,obp:.340,slg:.460},
  {n:"Rafael Devers",p:["3B"],ba:.280,obp:.360,slg:.510},
  {n:"Freddie Freeman",p:["1B"],ba:.290,obp:.380,slg:.500}
];

BATTERS.forEach(b => { if (!b.deg) b.deg = genDeg(b.ba, b.obp, b.slg); });

module.exports = { BATTERS, OUTCOME_KEYS, OUTCOME_LABELS, genDeg };
