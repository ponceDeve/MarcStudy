import { useState,useMemo,useEffect,useRef } from "react";

import manifest from "../data/manifest.json";

import { useLocalStorage } from "../hooks/useLocalStorage";

import { buscarCoincidencia,buscarPosicion,extraerFragmento,puntajeDeTexto } from "../lib/buscador";

import { embeberTextos,similitudCoseno } from "../lib/semantico";

import EditarNombreModal from "./EditarNombreModal";

const CURSOS_ITEMS=manifest.cursos.map(c=>({
  type:"curso",
  nombre:c.nombre
}));

const TEMAS_ITEMS=manifest.cursos.flatMap(c=>c.temas.map(t=>({
  type:"tema",
  curso:c.nombre,
  tema:t.tema,
  archivo:t.archivo
})));

const UMBRAL_SEMANTICO=0.48;
const UMBRAL_RELATIVO_SEMANTICO=0.82;
const UMBRAL_LEXICO_SEMANTICO=0.22;
const DIFERENCIA_MINIMA_SEMANTICA=0.06;

let embeddingsCursos=null;
let embeddingsTemas=null;
let promesaEmbeddingsTemas=null;
let promesaEmbeddingsCursos=null;

function normalizarTexto(texto){
  return String(texto??"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function obtenerPalabras(texto){
  return normalizarTexto(texto).match(/[a-z0-9]+/g)||[];
}

function obtenerRaizPalabra(palabra){
  let p=normalizarTexto(palabra);

  if(p.length<=3) return p;

  const terminaciones=[
    "amientos","imientos","aciones","iciones",
    "adoras","edores","idores",
    "amente","mente","idades","ismos","istas",
    "acion","icion","amiento","imiento",
    "ando","iendo","ados","idos","adas","idas",
    "es","as","os","s"
  ];

  for(const terminacion of terminaciones){
    if(
      p.endsWith(terminacion)&&
      p.length-terminacion.length>=4
    ){
      p=p.slice(0,-terminacion.length);
      break;
    }
  }

  return p;
}

function palabrasCoinciden(palabraConsulta,palabraTexto){
  const a=normalizarTexto(palabraConsulta);
  const b=normalizarTexto(palabraTexto);

  if(!a||!b) return false;

  if(a===b) return true;

  const raizA=obtenerRaizPalabra(a);
  const raizB=obtenerRaizPalabra(b);

  if(raizA===raizB) return true;

  if(raizA.length>=4&&raizB.length>=4){
    if(
      raizA.startsWith(raizB)||
      raizB.startsWith(raizA)
    ){
      return true;
    }
  }

  return false;
}

function puntajeLexico(texto,consulta){
  const palabrasConsulta=obtenerPalabras(consulta);
  const palabrasTexto=obtenerPalabras(texto);

  if(!palabrasConsulta.length||!palabrasTexto.length) return 0;

  let puntuacion=0;

  for(const palabraConsulta of palabrasConsulta){
    let mejor=0;

    for(const palabraTexto of palabrasTexto){
      if(
        normalizarTexto(palabraConsulta)===
        normalizarTexto(palabraTexto)
      ){
        mejor=Math.max(mejor,1);
        continue;
      }

      if(palabrasCoinciden(palabraConsulta,palabraTexto)){
        mejor=Math.max(mejor,0.8);
      }
    }

    puntuacion+=mejor;
  }

  return puntuacion/palabrasConsulta.length;
}

function coincidenciaLexica(texto,consulta){
  return puntajeLexico(texto,consulta)>=1;
}

function ResaltarCoincidencia({texto,query}){
  if(!query.trim()) return texto;

  const textoOriginal=String(texto??"");
  const busqueda=query.trim();
  const textoNormalizado=normalizarTexto(textoOriginal);
  const busquedaNormalizada=normalizarTexto(busqueda);

  if(!busquedaNormalizada) return textoOriginal;

  const indice=textoNormalizado.indexOf(busquedaNormalizada);

  if(indice!==-1){
    return (
      <>
        {textoOriginal.slice(0,indice)}
        <span className="search-match">
          {textoOriginal.slice(indice,indice+busqueda.length)}
        </span>
        {textoOriginal.slice(indice+busqueda.length)}
      </>
    );
  }

  const palabrasConsulta=obtenerPalabras(busqueda);
  const partes=textoOriginal.split(/(\s+)/);

  return partes.map((parte,index)=>{
    const limpio=parte.replace(/[.,;:!?()[\]{}"']/g,"");

    const coincide=palabrasConsulta.some(
      p=>palabrasCoinciden(p,limpio)
    );

    return coincide
      ?(
        <span
          className="search-match"
          key={index}
        >
          {parte}
        </span>
      )
      :parte;
  });
}

function ResaltarFragmento({
  fragmento,
  indice,
  largoCoincidencia
}){
  if(indice==null||indice<0) return fragmento;

  const coincidencia=fragmento.slice(
    indice,
    indice+largoCoincidencia
  );

  if(!coincidencia) return fragmento;

  return (
    <>
      {fragmento.slice(0,indice)}
      <span className="search-match">
        {coincidencia}
      </span>
      {fragmento.slice(indice+largoCoincidencia)}
    </>
  );
}

function armarFragmentoExplicacion(explicacion,query){
  const indiceOriginal=buscarPosicion(
    explicacion,
    query
  );

  const fragmento=extraerFragmento(
    explicacion,
    indiceOriginal
  );

  if(indiceOriginal==null){
    return {
      fragmento,
      indice:null,
      largo:0
    };
  }

  const queryLimpia=query.trim();

  return {
    fragmento,
    indice:buscarPosicion(
      fragmento,
      queryLimpia
    ),
    largo:queryLimpia.length
  };
}

function buscarEnContenidoTema(contenidoTema,query){
  const q=query.trim();

  if(!q||contenidoTema.length===0) return [];

  const resultados=[];

  for(const punto of contenidoTema){
    const matchTexto=buscarCoincidencia(
      punto.texto,
      q
    );

    if(matchTexto){
      resultados.push({
        type:"contenido",
        puntoId:punto.id,
        seccionTitulo:punto.seccionTitulo,
        campo:"texto",
        texto:punto.texto,
        matchText:q,
        _score:puntajeDeTexto(punto.texto,q)+500
      });

      continue;
    }

    const matchExplicacion=buscarCoincidencia(
      punto.explicacion,
      q
    );

    if(matchExplicacion){
      resultados.push({
        type:"contenido",
        puntoId:punto.id,
        seccionTitulo:punto.seccionTitulo,
        campo:"explicacion",
        texto:punto.texto,
        explicacion:punto.explicacion,
        matchText:q,
        _score:puntajeDeTexto(
          punto.explicacion,
          q
        )
      });
    }
  }

  return resultados.sort(
    (a,b)=>b._score-a._score
  );
}

function obtenerTextoSemantico(item){
  if(item.type==="curso"){
    return `Curso: ${item.nombre}`;
  }

  return `Curso: ${item.curso}. Tema: ${item.tema}`;
}

async function prepararEmbeddingsTemas(){
  if(embeddingsTemas) return embeddingsTemas;

  if(promesaEmbeddingsTemas){
    return promesaEmbeddingsTemas;
  }

  promesaEmbeddingsTemas=embeberTextos(
    TEMAS_ITEMS.map(obtenerTextoSemantico)
  )
    .then(resultado=>{
      embeddingsTemas=resultado;
      return resultado;
    })
    .finally(()=>{
      promesaEmbeddingsTemas=null;
    });

  return promesaEmbeddingsTemas;
}

async function prepararEmbeddingsCursos(){
  if(embeddingsCursos) return embeddingsCursos;

  if(promesaEmbeddingsCursos){
    return promesaEmbeddingsCursos;
  }

  promesaEmbeddingsCursos=embeberTextos(
    CURSOS_ITEMS.map(obtenerTextoSemantico)
  )
    .then(resultado=>{
      embeddingsCursos=resultado;
      return resultado;
    })
    .finally(()=>{
      promesaEmbeddingsCursos=null;
    });

  return promesaEmbeddingsCursos;
}

function obtenerCoincidenciasLiterales(consulta){
  const q=normalizarTexto(consulta);

  if(!q){
    return {
      cursos:[],
      temas:[],
      coincidenciaLiteral:null
    };
  }

  const cursoExacto=CURSOS_ITEMS.find(
    curso=>normalizarTexto(curso.nombre)===q
  );

  if(cursoExacto){
    return {
      cursos:[cursoExacto],
      temas:[],
      coincidenciaLiteral:cursoExacto
    };
  }

  const temasCoincidentes=TEMAS_ITEMS.filter(
    tema=>normalizarTexto(tema.tema).includes(q)
  );

  if(temasCoincidentes.length>0){
    return {
      cursos:[],
      temas:temasCoincidentes,
      coincidenciaLiteral:
        temasCoincidentes.length===1
          ?temasCoincidentes[0]
          :null
    };
  }

  const temasLexicos=TEMAS_ITEMS.filter(
    tema=>coincidenciaLexica(tema.tema,q)
  );

  if(temasLexicos.length>0){
    return {
      cursos:[],
      temas:temasLexicos,
      coincidenciaLiteral:
        temasLexicos.length===1
          ?temasLexicos[0]
          :null
    };
  }

  const cursosCoincidentes=CURSOS_ITEMS.filter(
    curso=>normalizarTexto(curso.nombre).includes(q)
  );

  if(cursosCoincidentes.length>0){
    return {
      cursos:cursosCoincidentes,
      temas:[],
      coincidenciaLiteral:
        cursosCoincidentes.length===1
          ?cursosCoincidentes[0]
          :null
    };
  }

  const cursosLexicos=CURSOS_ITEMS.filter(
    curso=>coincidenciaLexica(curso.nombre,q)
  );

  return {
    cursos:cursosLexicos,
    temas:[],
    coincidenciaLiteral:
      cursosLexicos.length===1
        ?cursosLexicos[0]
        :null
  };
}

async function buscarFuertes(query){
  const consulta=query.trim();

  if(!consulta){
    return {
      cursos:[],
      temas:[],
      coincidenciasExactas:[],
      coincidenciaLiteral:null,
      esLiteral:false
    };
  }

  const literal=obtenerCoincidenciasLiterales(
    consulta
  );

  if(
    literal.cursos.length>0||
    literal.temas.length>0
  ){
    return {
      cursos:literal.cursos,
      temas:literal.temas,
      coincidenciasExactas:[
        ...literal.cursos,
        ...literal.temas
      ],
      coincidenciaLiteral:
        literal.coincidenciaLiteral,
      esLiteral:true
    };
  }

  try{
    await prepararEmbeddingsTemas();

    const [embeddingConsulta]=
      await embeberTextos([consulta]);

    if(
      !embeddingConsulta||
      !embeddingsTemas?.length
    ){
      return {
        cursos:[],
        temas:[],
        coincidenciasExactas:[],
        coincidenciaLiteral:null,
        esLiteral:false
      };
    }

    const temasSemanticos=TEMAS_ITEMS
      .map((item,index)=>{
        const semanticScore=similitudCoseno(
          embeddingConsulta,
          embeddingsTemas[index]
        );

        const lexicalScore=puntajeLexico(
          item.tema,
          consulta
        );

        return {
          ...item,
          _semanticScore:semanticScore,
          _lexicalScore:lexicalScore,
          _scoreFinal:
            semanticScore+
            lexicalScore*UMBRAL_LEXICO_SEMANTICO
        };
      })
      .sort(
        (a,b)=>b._scoreFinal-a._scoreFinal
      );

    const mejorTema=temasSemanticos[0];
    const segundoTema=temasSemanticos[1];

    if(mejorTema){
      const mejorPuntaje=mejorTema._scoreFinal;
      const segundoPuntaje=
        segundoTema?._scoreFinal||0;

      const diferencia=
        mejorPuntaje-segundoPuntaje;

      const temaValido=
        mejorTema._semanticScore>=UMBRAL_SEMANTICO&&
        mejorPuntaje>=UMBRAL_SEMANTICO&&
        mejorPuntaje>=
          segundoPuntaje*UMBRAL_RELATIVO_SEMANTICO&&
        diferencia>=DIFERENCIA_MINIMA_SEMANTICA;

      if(temaValido){
        const temasRelevantes=
          temasSemanticos.filter(
            tema=>
              tema._semanticScore>=UMBRAL_SEMANTICO&&
              tema._scoreFinal>=
                mejorPuntaje*
                UMBRAL_RELATIVO_SEMANTICO
          );

        if(temasRelevantes.length>0){
          return {
            cursos:[],
            temas:temasRelevantes,
            coincidenciasExactas:[],
            coincidenciaLiteral:null,
            esLiteral:false
          };
        }
      }
    }

    await prepararEmbeddingsCursos();

    if(!embeddingsCursos?.length){
      return {
        cursos:[],
        temas:[],
        coincidenciasExactas:[],
        coincidenciaLiteral:null,
        esLiteral:false
      };
    }

    const cursosSemanticos=CURSOS_ITEMS
      .map((item,index)=>({
        ...item,
        _semanticScore:similitudCoseno(
          embeddingConsulta,
          embeddingsCursos[index]
        )
      }))
      .sort(
        (a,b)=>b._semanticScore-a._semanticScore
      );

    const mejorCurso=cursosSemanticos[0];
    const segundoCurso=cursosSemanticos[1];

    if(mejorCurso){
      const diferenciaCurso=
        mejorCurso._semanticScore-
        (segundoCurso?._semanticScore||0);

      const cursoValido=
        mejorCurso._semanticScore>=UMBRAL_SEMANTICO&&
        diferenciaCurso>=DIFERENCIA_MINIMA_SEMANTICA;

      if(cursoValido){
        return {
          cursos:[mejorCurso],
          temas:[],
          coincidenciasExactas:[],
          coincidenciaLiteral:null,
          esLiteral:false
        };
      }
    }
  }catch(error){
    console.error(
      "Error en búsqueda semántica:",
      error
    );
  }

  return {
    cursos:[],
    temas:[],
    coincidenciasExactas:[],
    coincidenciaLiteral:null,
    esLiteral:false
  };
}

function agruparResultados({cursos,temas}){
  const grupos=[];

  if(cursos.length>0){
    for(const curso of cursos){
      const cursoManifest=manifest.cursos.find(
        c=>c.nombre===curso.nombre
      );

      grupos.push({
        curso:curso.nombre,
        temas:
          cursoManifest?.temas?.map(tema=>({
            type:"tema",
            curso:curso.nombre,
            tema:tema.tema,
            archivo:tema.archivo
          }))||[]
      });
    }

    return grupos;
  }

  const temasPorCurso=new Map();

  for(const tema of temas){
    if(!temasPorCurso.has(tema.curso)){
      temasPorCurso.set(tema.curso,[]);
    }

    temasPorCurso.get(tema.curso).push(tema);
  }

  for(const [curso,temasDelCurso] of temasPorCurso){
    grupos.push({
      curso,
      temas:temasDelCurso
    });
  }

  return grupos;
}

function construirItemsNavegables(
  grupos,
  cursoAbierto
){
  const items=[];

  for(const grupo of grupos){
    items.push({
      type:"curso",
      nombre:grupo.curso
    });

    if(grupo.curso!==cursoAbierto) continue;

    for(const tema of grupo.temas){
      items.push({
        type:"tema",
        curso:tema.curso,
        tema:tema.tema,
        archivo:tema.archivo
      });
    }
  }

  return items;
}

export default function SearchModal({
  open,
  onClose,
  onSelect,
  contenidoTema=[]
}){
  const [query,setQuery]=useState("");
  const [queryConfirmada,setQueryConfirmada]=useState("");
  const [inputFocused,setInputFocused]=useState(false);
  const [editarNombreAbierto,setEditarNombreAbierto]=useState(false);

  const [nombreUsuario,setNombreUsuario]=useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [fotoUsuario,setFotoUsuario]=useLocalStorage(
    "miEstudio_fotoUsuario",
    null
  );

  const [focusedIdx,setFocusedIdx]=useState(-1);

  // Solo puede existir un curso abierto a la vez.
  const [cursoAbierto,setCursoAbierto]=useState(null);

  const [fuertes,setFuertes]=useState({
    cursos:[],
    temas:[],
    coincidenciasExactas:[],
    coincidenciaLiteral:null,
    esLiteral:false
  });

  const [buscandoSemantica,setBuscandoSemantica]=
    useState(false);

  const inputRef=useRef(null);

  const hayQuery=
    queryConfirmada.trim()!=="";

  const gruposIniciales=useMemo(
    ()=>manifest.cursos.map(curso=>({
      curso:curso.nombre,
      temas:curso.temas.map(tema=>({
        type:"tema",
        curso:curso.nombre,
        tema:tema.tema,
        archivo:tema.archivo
      }))
    })),
    []
  );

  useEffect(()=>{
    if(!open) return;

    prepararEmbeddingsTemas().catch(error=>{
      console.error(
        "Error preparando búsqueda semántica:",
        error
      );
    });
  },[open]);

  useEffect(()=>{
    let cancelado=false;

    if(!hayQuery){
      setFuertes({
        cursos:[],
        temas:[],
        coincidenciasExactas:[],
        coincidenciaLiteral:null,
        esLiteral:false
      });

      setBuscandoSemantica(false);

      return;
    }

    const literal=obtenerCoincidenciasLiterales(
      queryConfirmada
    );

    if(
      literal.cursos.length>0||
      literal.temas.length>0
    ){
      setFuertes({
        cursos:literal.cursos,
        temas:literal.temas,
        coincidenciasExactas:[
          ...literal.cursos,
          ...literal.temas
        ],
        coincidenciaLiteral:
          literal.coincidenciaLiteral,
        esLiteral:true
      });

      setBuscandoSemantica(false);

      return;
    }

    setBuscandoSemantica(true);

    buscarFuertes(queryConfirmada)
      .then(resultado=>{
        if(cancelado) return;

        setFuertes(resultado);
      })
      .catch(error=>{
        if(cancelado) return;

        console.error(
          "Error buscando:",
          error
        );

        setFuertes({
          cursos:[],
          temas:[],
          coincidenciasExactas:[],
          coincidenciaLiteral:null,
          esLiteral:false
        });
      })
      .finally(()=>{
        if(!cancelado){
          setBuscandoSemantica(false);
        }
      });

    return ()=>{
      cancelado=true;
    };
  },[queryConfirmada,hayQuery]);

  const resultadosContenido=useMemo(
    ()=>hayQuery
      ?buscarEnContenidoTema(
          contenidoTema,
          queryConfirmada
        )
      :[],
    [
      queryConfirmada,
      hayQuery,
      contenidoTema
    ]
  );

  const grupos=useMemo(
    ()=>agruparResultados(fuertes),
    [fuertes]
  );

  const mostrarListaInicial=
    open&&!hayQuery;

  const mostrarResultados=
    open&&hayQuery;

  const contenidoExpandido=
    mostrarListaInicial||mostrarResultados;

  const gruposVisibles=useMemo(
    ()=>hayQuery
      ?grupos
      :gruposIniciales,
    [
      hayQuery,
      grupos,
      gruposIniciales
    ]
  );

  const itemsNavegables=useMemo(
    ()=>construirItemsNavegables(
      gruposVisibles,
      cursoAbierto
    ),
    [
      gruposVisibles,
      cursoAbierto
    ]
  );

  function obtenerIndiceElemento(item){
    return itemsNavegables.findIndex(elemento=>{
      if(elemento.type!==item.type){
        return false;
      }

      if(elemento.type==="curso"){
        return elemento.nombre===item.nombre;
      }

      return (
        elemento.curso===item.curso&&
        elemento.tema===item.tema&&
        elemento.archivo===item.archivo
      );
    });
  }

  function ejecutarBusqueda(item){
    if(!item) return;

    setQuery("");
    setQueryConfirmada("");
    setInputFocused(false);
    setFocusedIdx(-1);
    setCursoAbierto(null);

    onSelect(item);
    onClose();
  }

  function confirmarBusqueda(){
    const consulta=query.trim();

    if(!consulta) return;

    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }

  function manejarClickCurso(curso){
    setCursoAbierto(actual=>{
      if(actual===curso){
        return null;
      }

      return curso;
    });
  }

  function ejecutarBusquedaActual(){
    const consulta=query.trim();

    if(!consulta) return;

    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }

  function limpiarBusqueda(){
    setQuery("");
    setQueryConfirmada("");
    setFocusedIdx(-1);
    setCursoAbierto(null);

    requestAnimationFrame(()=>{
      inputRef.current?.focus();
    });
  }

  function moverSeleccion(direccion){
    if(!open) return;

    const total=itemsNavegables.length;

    if(!total){
      setFocusedIdx(-1);
      return;
    }

    setFocusedIdx(actual=>{
      if(actual===-1){
        return direccion>0
          ?0
          :total-1;
      }

      const siguiente=actual+direccion;

      if(siguiente<0) return 0;

      if(siguiente>=total){
        return total-1;
      }

      return siguiente;
    });
  }

  function seleccionarElementoActual(){
    if(
      focusedIdx<0||
      focusedIdx>=itemsNavegables.length
    ){
      return;
    }

    ejecutarBusqueda(
      itemsNavegables[focusedIdx]
    );
  }

  useEffect(()=>{
    if(focusedIdx<0) return;

    const elemento=document.querySelector(
      `[data-search-index="${focusedIdx}"]`
    );

    if(!elemento) return;

    elemento.scrollIntoView({
      behavior:"smooth",
      block:"nearest"
    });
  },[focusedIdx,itemsNavegables]);

  useEffect(()=>{
    setFocusedIdx(-1);

    if(!hayQuery){
      setCursoAbierto(null);
      return;
    }

    /*
     * Si la búsqueda devuelve varios cursos,
     * solo se abre el primero.
     */
    if(fuertes.temas.length>0){
      setCursoAbierto(
        fuertes.temas[0]?.curso??null
      );

      return;
    }

    setCursoAbierto(null);
  },[
    queryConfirmada,
    hayQuery,
    fuertes
  ]);

  useEffect(()=>{
    if(!open) return;

    setQuery("");
    setQueryConfirmada("");
    setInputFocused(true);
    setFocusedIdx(-1);
    setCursoAbierto(null);

    requestAnimationFrame(()=>{
      inputRef.current?.focus();
    });
  },[open]);

  useEffect(()=>{
    if(!open) return;

    function onKeyDown(e){
      if(
        document.activeElement===
        inputRef.current
      ){
        return;
      }

      if(e.key==="Escape"){
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if(e.key==="ArrowDown"){
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(1);
        return;
      }

      if(e.key==="ArrowUp"){
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(-1);
        return;
      }

      if(e.key==="Enter"){
        if(
          focusedIdx>=0&&
          focusedIdx<itemsNavegables.length
        ){
          e.preventDefault();
          e.stopPropagation();
          seleccionarElementoActual();
          return;
        }

        if(query.trim()){
          e.preventDefault();
          e.stopPropagation();
          ejecutarBusquedaActual();
        }
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
      true
    );

    return ()=>{
      document.removeEventListener(
        "keydown",
        onKeyDown,
        true
      );
    };
  },[
    open,
    onClose,
    focusedIdx,
    itemsNavegables,
    query
  ]);

  const inputTieneLista=
    mostrarListaInicial||
    (
      mostrarResultados&&
      grupos.length>0
    );

  function renderGrupo(
    g,
    grupoIndex,
    esBusqueda=false
  ){
    const cursoIndex=obtenerIndiceElemento({
      type:"curso",
      nombre:g.curso
    });

    const estaAbierto=
      cursoAbierto===g.curso;

    return (
      <div
        key={`${
          esBusqueda
            ?"grupo"
            :"grupo-inicial"
        }-${g.curso}-${grupoIndex}`}
        className="search-group"
      >
        <div
          className={`search-course-row${
            estaAbierto
              ?" is-open"
              :""
          }`}
        >
          <button
            type="button"
            data-search-index={cursoIndex}
            className={`search-result-item is-curso${
              cursoIndex===focusedIdx
                ?" is-focused"
                :""
            }${
              estaAbierto
                ?" is-open"
                :""
            }`}
            onClick={()=>
              ejecutarBusqueda({
                type:"curso",
                nombre:g.curso
              })
            }
          >
            <span className="curso-title">
              {esBusqueda?(
                <ResaltarCoincidencia
                  texto={g.curso}
                  query={queryConfirmada}
                />
              ):(
                g.curso
              )}
            </span>
          </button>

          <button
            type="button"
            className={`search-course-toggle${
              estaAbierto
                ?" is-open"
                :""
            }`}
            aria-label={
              estaAbierto
                ?`Cerrar temas de ${g.curso}`
                :`Mostrar temas de ${g.curso}`
            }
            onClick={()=>
              manejarClickCurso(g.curso)
            }
          >
            <i
              className={`fa-solid ${
                estaAbierto
                  ?"fa-minus"
                  :"fa-plus"
              }`}
            />
          </button>
        </div>

        <div
          className={`search-group__temas${
            estaAbierto
              ?" is-open"
              :""
          }`}
        >
          {g.temas.map((t,temaIndex)=>{
            const index=
              obtenerIndiceElemento(t);

            return (
              <button
                type="button"
                key={`tema-${
                  esBusqueda
                    ?""
                    :"inicial-"
                }${t.curso}-${t.tema}-${
                  t.archivo||""
                }-${grupoIndex}-${temaIndex}`}
                data-search-index={index}
                onClick={()=>
                  ejecutarBusqueda(t)
                }
                className={`search-result-item is-tema${
                  index===focusedIdx
                    ?" is-focused"
                    :""
                }`}
              >
                <p className="search-result-item__tema">
                  {esBusqueda?(
                    <ResaltarCoincidencia
                      texto={t.tema}
                      query={queryConfirmada}
                    />
                  ):(
                    t.tema
                  )}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`search-overlay${
        open
          ?""
          :" is-closed"
      }`}
      onClick={e=>{
        if(e.target===e.currentTarget){
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      <div
        className={`search-box${
          contenidoExpandido
            ?" is-expanded"
            :""
        }`}
      >
        <div
          className={`search-input-row${
            inputTieneLista
              ?" has-query"
              :""
          }`}
        >
          <button
            type="button"
            className="search-input-lupa-izq"
            aria-label="Buscar"
            onMouseDown={e=>{
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={confirmarBusqueda}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>

          <input
            autoComplete="off"
            type="search"
            name="buscar-curso-tema"
            ref={inputRef}
            value={query}
            onFocus={()=>
              setInputFocused(true)
            }
            onBlur={()=>{
              setTimeout(()=>{
                setInputFocused(false);
              },100);
            }}
            onChange={e=>{
              setQuery(e.target.value);
              setFocusedIdx(-1);
            }}
            onKeyDown={e=>{
              if(e.key==="Escape"){
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
              }

              if(e.key==="ArrowDown"){
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(1);
                return;
              }

              if(e.key==="ArrowUp"){
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(-1);
                return;
              }

              if(e.key==="Enter"){
                e.preventDefault();
                e.stopPropagation();

                if(
                  focusedIdx>=0&&
                  focusedIdx<
                    itemsNavegables.length
                ){
                  seleccionarElementoActual();
                  return;
                }

                if(query.trim()){
                  ejecutarBusquedaActual();
                }
              }
            }}
            placeholder="Buscar curso o tema..."
            className="search-input"
          />

          {query.trim()!==""&&(
            <button
              type="button"
              className="search-input-clear"
              aria-label="Limpiar búsqueda"
              onMouseDown={e=>{
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={limpiarBusqueda}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {mostrarListaInicial&&(
          <div className="search-results">
            {gruposIniciales.map(
              (g,grupoIndex)=>
                renderGrupo(
                  g,
                  grupoIndex
                )
            )}
          </div>
        )}

        {mostrarResultados&&
          resultadosContenido.length>0&&(
            <div className="search-results">
              <div className="search-group">
                <p className="search-section-label">
                  En este tema
                </p>

                {resultadosContenido.map(
                  (r,idx)=>{
                    const fragmento=
                      r.campo==="explicacion"
                        ?armarFragmentoExplicacion(
                            r.explicacion,
                            queryConfirmada
                          )
                        :null;

                    return (
                      <button
                        type="button"
                        key={`contenido-${r.puntoId}-${r.campo}-${idx}`}
                        onClick={()=>
                          ejecutarBusqueda(r)
                        }
                        className="search-result-item is-tema is-contenido"
                      >
                        {r.seccionTitulo&&(
                          <p className="search-result-item__seccion">
                            {r.seccionTitulo}
                          </p>
                        )}

                        <p className="search-result-item__tema">
                          {r.campo==="texto"?(
                            <ResaltarCoincidencia
                              texto={r.texto}
                              query={queryConfirmada}
                            />
                          ):(
                            <ResaltarFragmento
                              fragmento={
                                fragmento.fragmento
                              }
                              indice={
                                fragmento.indice
                              }
                              largoCoincidencia={
                                fragmento.largo
                              }
                            />
                          )}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

        {mostrarResultados&&
          grupos.length>0&&(
            <div className="search-results">
              {grupos.map(
                (g,grupoIndex)=>
                  renderGrupo(
                    g,
                    grupoIndex,
                    true
                  )
              )}
            </div>
          )}

        {mostrarResultados&&
          grupos.length===0&&
          resultadosContenido.length===0&&
          !buscandoSemantica&&(
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results">
                  <p className="search-result-item__tema">
                    Sin resultados para "{queryConfirmada}"
                  </p>
                </div>
              </div>
            </div>
          )}

        {mostrarResultados&&
          buscandoSemantica&&
          grupos.length===0&&
          resultadosContenido.length===0&&(
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results search-loading">
                  <p className="search-result-item__tema">
                    Buscando...
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      <EditarNombreModal
        open={editarNombreAbierto}
        nombreActual={nombreUsuario}
        fotoActual={fotoUsuario}
        onGuardar={(n,f)=>{
          setNombreUsuario(n);
          setFotoUsuario(f);
          setEditarNombreAbierto(false);
        }}
        onCancelar={()=>
          setEditarNombreAbierto(false)
        }
      />
    </div>
  );
}