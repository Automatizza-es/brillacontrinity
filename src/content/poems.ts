/**
 * Poetry library. Add a poem by appending an entry; pages and index render from it.
 * `text` keeps Trinity's original line breaks ("\n") and stanzas (blank line "\n\n").
 * Leave `text` out while the original has not been supplied — the page shows it as pending.
 * Only add texts supplied by Trinity.
 */
export type Poem = {
  slug: string;
  title: string;
  text?: string;
  /** optional short description for the index */
  description?: string;
  /** slug of a publication in src/content/publications.ts */
  publication?: string;
  provisionalTitle?: boolean;
  /** date supplied by the author, e.g. "7 de mayo de 2023" */
  writtenOn?: string;
};

export const poems: Poem[] = [
  {
    slug: "atrevete-a-brillar",
    title: "Atrévete a brillar",
    writtenOn: "7 de mayo de 2023",
    text: "Hay tanto brillo dentro de ti al que no le permites salir\nA veces siento que crees que no tienes derecho siquiera\nni a estar aquí…\n\nNo sé si es algo heredado o que alguien te haya podido enseñar,\npero sé que tú eres estrella nacida para iluminar.\n\nAsí es que mira a la cara a todas tus culpas, tus miedos,\nperdónate por aquello que sea\ny ¡¡¡atrévete a brillar!!!\n\nNo temas por otros,\nno vas a eclipsar,\nmás bien al contrario,\nlos podrás inspirar y así ellos también brillarán\npues también son estrellas nacidas para iluminar.",
  },
  {
    slug: "quise-ser",
    title: "Quise ser…",
    provisionalTitle: true,
    text: "Quise ser organizada,\nquise ser mejor persona,\nquise ser considerada\nquise ser útil, ser vista, ser reconocida...\nQuise ser...\nPero en ese querer ser, quedó por completo olvidado mi ser\n¿Qué quería él?\nQuizás que me dejara tranquila\nQuizás que no intentara frenar ni dirigir el caos de mi vida\nQuizás tan solo ser libre\nQuizás simplemente dejar de querer\nQuizás solo SER",
  },
  {
    slug: "circulo-de-mujeres",
    title: "Círculo de mujeres",
    publication: "cuentos-y-poesia",
    text: "Círculo de mujeres meditando,\nreunión de brujas…\nMujeres compartiendo sueños, enfados y anhelos,\nmujeres de carne y hueso\nque abrazan la tierra y que tocan el cielo,\nque desnudan su alma aunque a veces\nocultan su cara.\nMujeres jugando a ser niñas, ancianas y sabias.\nSanando, sanando, sanándose ellas\ny sanado a tantos,\nriendo y llorando.\nEscucha, mi niña,\nque es tu corazón el que grita,\nescucha,\nescucha y\nrespira,\ntan solo\nRESPIRA.",
  },
  {
    slug: "yo-soy-agua",
    title: "Yo soy agua",
    publication: "cuentos-y-poesia",
    text: "Yo soy agua,\na veces tranquila, transparente y mansa,\nque acoge, que te hace descansar y ella misma descansa;\npero otras también marejada, cascada\nque se precipita en picado,\nque arrastra, que arrasa.\nY soy también viento,\nbrisa suave que alegra, refresca,\nque ayuda a respirar y susurra,\ny otras veces desata su furia en un huracán y te asusta.\nY soy luna,\ncon todas sus caras,\ncon todas sus dudas,\nluna llena potente que brilla,\nque te muestra todo su esplendor y su fuerza\ny hasta te deslumbra;\npero otras, no se atreve siquiera a salir\ny se esconde tras la noche oscura,\npues se siente débil e insegura…\nYo soy todo eso y mi error\nes querer no serlo y sufrir por no ser\nestable montaña, manzano, rosal o llanura,\nque además de imposible es absurdo\nluchar contra lo que se es\nen lugar de aceptarse y saber\nque esa especial energía\nel mundo también la necesita.",
  },
  {
    slug: "me-pierdo",
    title: "Me pierdo…",
    publication: "cuentos-y-poesia",
    text: "Me pierdo comparándome con otras y pensando\nque no soy tan buena.\nMe pierdo en mis ocupaciones infinitas\nen mi falta de tiempo\nen esa encrucijada de inventar excusas\nque me hagan olvidar el sentimiento\nde no merecer esto o aquello.\nMe pierdo cuando intento gustar a los demás\ny rompo el compromiso conmigo misma.\nMe pierdo queriendo ser la niña buena\nque nunca da problemas.\nY me encuentro en las sábanas que acarician mi cuerpo,\nme encuentro cuando río a carcajadas\ny me atrevo a gritar la verdad que llevo dentro, lo que siento,\ncuando me da igual, simplemente no existe\nser mejor o peor,\ntan solo ser, estar,\ncuando no me comparo sino que me fusiono\ncon todo lo demás.\nMe encuentro cuando mando a hacer puñetas\ntodas las reglas,\ncuando incluso me perdono por perderme\ntantas veces.",
  },
  {
    slug: "desaprendiendo",
    title: "Desaprendiendo",
    publication: "cuentos-y-poesia",
    text: "Te enseñaron a ser la niña buena,\nsiempre correcta,\ncasi nunca sincera,\na respetar las reglas,\na tragarte los gritos desgarrados y las quejas,\na meter tu corazón en una botella…\nPero afortunadamente hay en ti una parte salvaje\npor la que el alma se escapa\ny ríe a carcajadas\ny baila descalza y se desnuda y grita\ny se emborracha en una mirada.\nY a veces, aunque sea solo a veces,\ndeja que caigan\ntodas las máscaras.",
  },
];

export const getPoem = (slug: string) => poems.find((p) => p.slug === slug);
