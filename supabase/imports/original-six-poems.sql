-- PREPARED ONLY: requires explicit authorization before remote execution.
-- Project: brilla-con-trinity / gwckhuwespupovgweahj.
-- Source SHA-256: 1c7bb3671c17b689f707493a7ddbf08a3b87386d28a67c56a781a2f2ffe0d3a1
-- INSERT only. Exact matches are skipped; differences abort the whole transaction.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table public.publications, public.poems in share row exclusive mode;
do $trinity_import$
declare
 source jsonb := $trinity_source${
  "publication": {
    "slug": "cuentos-y-poesia",
    "title": "Cuentos y poesía",
    "publisher": "Editorial Rubin",
    "place": "San Luis, Argentina",
    "year": 2026,
    "kind": "Antología colectiva",
    "role": "Autora participante: Trinidad López (Trinity)",
    "synopsis": null,
    "cover_url": "/images/portada-cuentos-y-poesia.jpeg",
    "isbn": null,
    "purchase_links": []
  },
  "poems": [
    {
      "slug": "atrevete-a-brillar",
      "title": "Atrévete a brillar",
      "body": "Hay tanto brillo dentro de ti al que no le permites salir\nA veces siento que crees que no tienes derecho siquiera\nni a estar aquí…\n\nNo sé si es algo heredado o que alguien te haya podido enseñar,\npero sé que tú eres estrella nacida para iluminar.\n\nAsí es que mira a la cara a todas tus culpas, tus miedos,\nperdónate por aquello que sea\ny ¡¡¡atrévete a brillar!!!\n\nNo temas por otros,\nno vas a eclipsar,\nmás bien al contrario,\nlos podrás inspirar y así ellos también brillarán\npues también son estrellas nacidas para iluminar.",
      "description": null,
      "written_on": "2023-05-07",
      "written_on_original": "7 de mayo de 2023",
      "status": "published",
      "published_at": null,
      "sort_order": 0,
      "publication_slug": null
    },
    {
      "slug": "quise-ser",
      "title": "Quise ser…",
      "body": "Quise ser organizada,\nquise ser mejor persona,\nquise ser considerada\nquise ser útil, ser vista, ser reconocida...\nQuise ser...\nPero en ese querer ser, quedó por completo olvidado mi ser\n¿Qué quería él?\nQuizás que me dejara tranquila\nQuizás que no intentara frenar ni dirigir el caos de mi vida\nQuizás tan solo ser libre\nQuizás simplemente dejar de querer\nQuizás solo SER",
      "description": null,
      "written_on": null,
      "written_on_original": null,
      "status": "published",
      "published_at": null,
      "sort_order": 1,
      "publication_slug": null
    },
    {
      "slug": "circulo-de-mujeres",
      "title": "Círculo de mujeres",
      "body": "Círculo de mujeres meditando,\nreunión de brujas…\nMujeres compartiendo sueños, enfados y anhelos,\nmujeres de carne y hueso\nque abrazan la tierra y que tocan el cielo,\nque desnudan su alma aunque a veces\nocultan su cara.\nMujeres jugando a ser niñas, ancianas y sabias.\nSanando, sanando, sanándose ellas\ny sanado a tantos,\nriendo y llorando.\nEscucha, mi niña,\nque es tu corazón el que grita,\nescucha,\nescucha y\nrespira,\ntan solo\nRESPIRA.",
      "description": null,
      "written_on": null,
      "written_on_original": null,
      "status": "published",
      "published_at": null,
      "sort_order": 2,
      "publication_slug": "cuentos-y-poesia"
    },
    {
      "slug": "yo-soy-agua",
      "title": "Yo soy agua",
      "body": "Yo soy agua,\na veces tranquila, transparente y mansa,\nque acoge, que te hace descansar y ella misma descansa;\npero otras también marejada, cascada\nque se precipita en picado,\nque arrastra, que arrasa.\nY soy también viento,\nbrisa suave que alegra, refresca,\nque ayuda a respirar y susurra,\ny otras veces desata su furia en un huracán y te asusta.\nY soy luna,\ncon todas sus caras,\ncon todas sus dudas,\nluna llena potente que brilla,\nque te muestra todo su esplendor y su fuerza\ny hasta te deslumbra;\npero otras, no se atreve siquiera a salir\ny se esconde tras la noche oscura,\npues se siente débil e insegura…\nYo soy todo eso y mi error\nes querer no serlo y sufrir por no ser\nestable montaña, manzano, rosal o llanura,\nque además de imposible es absurdo\nluchar contra lo que se es\nen lugar de aceptarse y saber\nque esa especial energía\nel mundo también la necesita.",
      "description": null,
      "written_on": null,
      "written_on_original": null,
      "status": "published",
      "published_at": null,
      "sort_order": 3,
      "publication_slug": "cuentos-y-poesia"
    },
    {
      "slug": "me-pierdo",
      "title": "Me pierdo…",
      "body": "Me pierdo comparándome con otras y pensando\nque no soy tan buena.\nMe pierdo en mis ocupaciones infinitas\nen mi falta de tiempo\nen esa encrucijada de inventar excusas\nque me hagan olvidar el sentimiento\nde no merecer esto o aquello.\nMe pierdo cuando intento gustar a los demás\ny rompo el compromiso conmigo misma.\nMe pierdo queriendo ser la niña buena\nque nunca da problemas.\nY me encuentro en las sábanas que acarician mi cuerpo,\nme encuentro cuando río a carcajadas\ny me atrevo a gritar la verdad que llevo dentro, lo que siento,\ncuando me da igual, simplemente no existe\nser mejor o peor,\ntan solo ser, estar,\ncuando no me comparo sino que me fusiono\ncon todo lo demás.\nMe encuentro cuando mando a hacer puñetas\ntodas las reglas,\ncuando incluso me perdono por perderme\ntantas veces.",
      "description": null,
      "written_on": null,
      "written_on_original": null,
      "status": "published",
      "published_at": null,
      "sort_order": 4,
      "publication_slug": "cuentos-y-poesia"
    },
    {
      "slug": "desaprendiendo",
      "title": "Desaprendiendo",
      "body": "Te enseñaron a ser la niña buena,\nsiempre correcta,\ncasi nunca sincera,\na respetar las reglas,\na tragarte los gritos desgarrados y las quejas,\na meter tu corazón en una botella…\nPero afortunadamente hay en ti una parte salvaje\npor la que el alma se escapa\ny ríe a carcajadas\ny baila descalza y se desnuda y grita\ny se emborracha en una mirada.\nY a veces, aunque sea solo a veces,\ndeja que caigan\ntodas las máscaras.",
      "description": null,
      "written_on": null,
      "written_on_original": null,
      "status": "published",
      "published_at": null,
      "sort_order": 5,
      "publication_slug": "cuentos-y-poesia"
    }
  ]
}$trinity_source$::jsonb;
 expected jsonb; actual jsonb; publication_id uuid;
 before_unrelated jsonb; after_unrelated jsonb;
 inserted_poems integer := 0;
begin
 if current_user <> 'postgres' then raise exception 'Use the explicitly authorized project owner procedure'; end if;
 select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) into before_unrelated from public.poems p where not(p.slug=any(array['atrevete-a-brillar','quise-ser','circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo']));
 select to_jsonb(pub) - 'id' - 'created_at' - 'updated_at',pub.id into actual,publication_id from public.publications pub where pub.slug=source->'publication'->>'slug';
 if found and actual is distinct from source->'publication' then raise exception 'Publication conflict: manual review required'; end if;
 -- Check every original before inserting anything. Never overwrite editorial changes.
 for expected in select value from jsonb_array_elements(source->'poems') loop
   select jsonb_build_object('slug',p.slug,'title',p.title,'body',p.body,'description',p.description,'written_on',p.written_on,'written_on_original',p.written_on_original,'status',p.status,'published_at',p.published_at,'sort_order',p.sort_order,'publication_slug',pub.slug) into actual from public.poems p left join public.publications pub on pub.id=p.publication_id where p.slug=expected->>'slug';
   if found and actual is distinct from expected then raise exception 'Poem slug conflict: %; nothing will be overwritten',expected->>'slug'; end if;
 end loop;
 insert into public.publications(slug,title,publisher,place,year,kind,role,synopsis,cover_url,isbn,purchase_links)
 select slug,title,publisher,place,year,kind,role,synopsis,cover_url,isbn,purchase_links from jsonb_to_record(source->'publication') as x(slug text,title text,publisher text,place text,year integer,kind text,role text,synopsis text,cover_url text,isbn text,purchase_links jsonb)
 on conflict(slug) do nothing;
 select id into strict publication_id from public.publications where slug=source->'publication'->>'slug';
 insert into public.poems(slug,title,body,description,written_on,written_on_original,status,published_at,sort_order,publication_id)
 select slug,title,body,description,written_on,written_on_original,status,published_at,sort_order,case when publication_slug is null then null else publication_id end
 from jsonb_to_recordset(source->'poems') as x(slug text,title text,body text,description text,written_on date,written_on_original text,status text,published_at timestamptz,sort_order integer,publication_slug text)
 on conflict(slug) do nothing;
 get diagnostics inserted_poems = row_count;
 for expected in select value from jsonb_array_elements(source->'poems') loop
   select jsonb_build_object('slug',p.slug,'title',p.title,'body',p.body,'description',p.description,'written_on',p.written_on,'written_on_original',p.written_on_original,'status',p.status,'published_at',p.published_at,'sort_order',p.sort_order,'publication_slug',pub.slug) into actual from public.poems p left join public.publications pub on pub.id=p.publication_id where p.slug=expected->>'slug';
   if not found or actual is distinct from expected then raise exception 'Post-import comparison failed'; end if;
 end loop;
 select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) into after_unrelated from public.poems p where not(p.slug=any(array['atrevete-a-brillar','quise-ser','circulo-de-mujeres','yo-soy-agua','me-pierdo','desaprendiendo']));
 if before_unrelated is distinct from after_unrelated then raise exception 'Unrelated poems changed: rollback required'; end if;
 raise notice 'Originals checked: 6. Newly inserted: %. Unrelated poems unchanged.',inserted_poems;
end;
$trinity_import$;
commit;
