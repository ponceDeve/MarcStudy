import { useState,useMemo,useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom";
import manifest from "../data/manifest.json";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  embeberTextos,
  similitudCoseno
} from "../lib/semantico";
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
const INGLES_EN_PAGINA_APARTE=false;
function esCursoIngles(nombre){
  return INGLES_EN_PAGINA_APARTE&&normalizarTexto(nombre)==="ingles";
}
function obtenerPalabras(texto){
  return normalizarTexto(texto).match(/[a-z0-9]+/g)||[];
}
function obtenerRaizPalabra(palabra){
  let p=normalizarTexto(palabra);
  if(p.length<=3)return p;
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
  if(!a||!b)return false;
  if(a===b)return true;
  const raizA=obtenerRaizPalabra(a);
  const raizB=obtenerRaizPalabra(b);
  if(raizA===raizB)return true;
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
  if(!palabrasConsulta.length||!palabrasTexto.length){
    return 0;
  }
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
  if(!query.trim())return texto;
  const textoOriginal=String(texto??"");
  const busqueda=query.trim();
  const textoNormalizado=normalizarTexto(textoOriginal);
  const busquedaNormalizada=normalizarTexto(busqueda);
  if(!busquedaNormalizada)return textoOriginal;
  const indice=textoNormalizado.indexOf(busquedaNormalizada);
  if(indice!==-1){
    return (
      <span>
        {textoOriginal.slice(0,indice)}
        <span className="search-match">
          {textoOriginal.slice(indice,indice+busqueda.length)}
        </span>
        {textoOriginal.slice(indice+busqueda.length)}
      </span>
    );
  }
  const palabrasConsulta=obtenerPalabras(busqueda);
  const partes=textoOriginal.split(/(\s+)/);
  return (
    <span>
      {partes.map((parte,index)=>{
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
      })}
    </span>
  );
}
function obtenerTextoSemantico(item){
  if(item.type==="curso"){
    return `Curso: ${item.nombre}`;
  }
  return `Curso: ${item.curso}. Tema: ${item.tema}`;
}
async function prepararEmbeddingsTemas(){
  if(embeddingsTemas)return embeddingsTemas;
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
  if(embeddingsCursos)return embeddingsCursos;
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
    temasPorCurso.get(tema.curso).push({
      type:"tema",
      curso:tema.curso,
      tema:tema.tema,
      archivo:tema.archivo
    });
  }
  for(const [curso,temasDelCurso] of temasPorCurso){
    grupos.push({
      curso,
      temas:temasDelCurso
    });
  }
  return grupos;
}
function construirItemsNavegables(grupos){
  const items=[];
  for(const grupo of grupos){
    items.push({
      type:"curso",
      nombre:grupo.curso
    });
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
  onSelect
}){
  const navigate=useNavigate();
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
  const [cursoSeleccionado,setCursoSeleccionado]=useState(null);
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
  const grupoCursoSeleccionado=useMemo(()=>{
    if(!cursoSeleccionado)return null;
    return gruposIniciales.find(
      grupo=>grupo.curso===cursoSeleccionado
    )||null;
  },[
    cursoSeleccionado,
    gruposIniciales
  ]);
  const cursoBusquedaSeleccionado=
    hayQuery&&
    fuertes.esLiteral&&
    fuertes.coincidenciaLiteral?.type==="curso"&&
    cursoSeleccionado===
      fuertes.coincidenciaLiteral.nombre;
  const mostrarCursoSeleccionado=
    !!cursoSeleccionado&&
    !!grupoCursoSeleccionado&&
    (
      !hayQuery||
      cursoBusquedaSeleccionado
    );
  useEffect(()=>{
    if(!open)return;
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
        if(cancelado)return;
        setFuertes(resultado);
      })
      .catch(error=>{
        if(cancelado)return;
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
  const grupos=useMemo(
    ()=>agruparResultados(fuertes),
    [fuertes]
  );
  const gruposVisibles=useMemo(()=>{
    if(mostrarCursoSeleccionado){
      return [grupoCursoSeleccionado];
    }
    if(hayQuery){
      return grupos;
    }
    if(cursoSeleccionado&&grupoCursoSeleccionado){
      return [grupoCursoSeleccionado];
    }
    return gruposIniciales.map(grupo=>({
      curso:grupo.curso,
      temas:[]
    }));
  },[
    mostrarCursoSeleccionado,
    grupoCursoSeleccionado,
    hayQuery,
    grupos,
    cursoSeleccionado,
    gruposIniciales
  ]);
  const mostrarListaInicial=
    open&&!hayQuery;
  const mostrarResultados=
    open&&hayQuery;
  const contenidoExpandido=
    mostrarListaInicial||
    mostrarResultados;
  const itemsNavegables=useMemo(
    ()=>construirItemsNavegables(
      gruposVisibles
    ),
    [gruposVisibles]
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
  function abrirCurso(nombre){
    setCursoSeleccionado(nombre);
    setFocusedIdx(-1);
  }
  function volverCursos(){
    setCursoSeleccionado(null);
    setFocusedIdx(-1);
  }
  function ejecutarBusqueda(item){
    if(!item)return;
    setQuery("");
    setQueryConfirmada("");
    setInputFocused(false);
    setFocusedIdx(-1);
    setCursoSeleccionado(null);
    const cursoDelItem=
      item.type==="curso"
        ?item.nombre
        :item.curso;
    if(esCursoIngles(cursoDelItem)){
      onClose();
      navigate("/ingles");
      return;
    }
    onSelect(item);
    onClose();
  }
  function confirmarBusqueda(){
    const consulta=query.trim();
    if(!consulta)return;
    setCursoSeleccionado(null);
    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }
  function ejecutarBusquedaActual(){
    const consulta=query.trim();
    if(!consulta)return;
    setCursoSeleccionado(null);
    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }
  function limpiarBusqueda(){
    setQuery("");
    setQueryConfirmada("");
    setCursoSeleccionado(null);
    setFocusedIdx(-1);
  }
  function moverSeleccion(direccion){
    if(!open)return;
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
      if(siguiente<0)return 0;
      if(siguiente>=total)return total-1;
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
    const item=itemsNavegables[focusedIdx];
    // Curso cerrado en la lista inicial -> abrirlo.
    // Curso ya abierto (o en resultados de búsqueda) -> mapa de niveles.
    if(
      item.type==="curso"&&
      !hayQuery&&
      cursoSeleccionado!==item.nombre
    ){
      abrirCurso(item.nombre);
      return;
    }
    ejecutarBusqueda(item);
  }
  useEffect(()=>{
    if(focusedIdx<0)return;
    const elemento=document.querySelector(
      `[data-search-index="${focusedIdx}"]`
    );
    if(!elemento)return;
    elemento.scrollIntoView({
      behavior:"smooth",
      block:"nearest"
    });
  },[focusedIdx,itemsNavegables]);
  useEffect(()=>{
    setFocusedIdx(-1);
  },[
    queryConfirmada,
    hayQuery,
    fuertes,
    cursoSeleccionado
  ]);
  useEffect(()=>{
    if(!open)return;
    setQuery("");
    setQueryConfirmada("");
    setCursoSeleccionado(null);
    setInputFocused(true);
    setFocusedIdx(-1);
    requestAnimationFrame(()=>{
      inputRef.current?.focus();
    });
  },[open]);
  useEffect(()=>{
    if(!open)return;
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
      (
        grupos.length>0||
        cursoBusquedaSeleccionado
      )
    );
  function renderGrupo(
    g,
    grupoIndex,
    esBusqueda=false,
    mostrarTemas=false
  ){
    const cursoIndex=obtenerIndiceElemento({
      type:"curso",
      nombre:g.curso
    });
    const esCursoAbierto=
      cursoSeleccionado===g.curso;
    const esCursoDeBusqueda=
      esBusqueda&&
      fuertes.cursos.some(
        curso=>curso.nombre===g.curso
      );
    const puedeAbrirCurso=
      !esBusqueda||
      esCursoDeBusqueda;
    return (
      <div
        key={`${
          esBusqueda
            ?"grupo"
            :"grupo-inicial"
        }-${g.curso}-${grupoIndex}`}
        className="search-group"
      >
        <div className="search-course-row">
          <button
            type="button"
            data-search-index={cursoIndex}
            className={`search-result-item is-curso${
              cursoIndex===focusedIdx
                ?" is-focused"
                :""
            }${
              esCursoAbierto
                ?" is-open"
                :""
            }`}
            onClick={()=>{
              // Dentro del curso (lista de temas visible) -> mapa de niveles
              if(mostrarTemas){
                ejecutarBusqueda({
                  type:"curso",
                  nombre:g.curso
                });
                return;
              }
              // Lista inicial -> abrir el curso
              if(puedeAbrirCurso){
                abrirCurso(g.curso);
              }
            }}
          >
            {esCursoAbierto&&(
              <i className="fa-solid fa-arrow-left search-course-arrow" />
            )}
            <span className="curso-title">
              {g.curso}
            </span>
          </button>
        </div>
        {mostrarTemas&&(
          <div className="search-group__temas is-open">
            {g.temas.map((t,temaIndex)=>{
              const index=
                obtenerIndiceElemento(t);
              return (
                <button
                  type="button"
                  key={`tema-${esBusqueda
                    ?""
                    :"inicial-"
                  }${t.curso}-${t.tema}-${t.archivo||""}-${grupoIndex}-${temaIndex}`}
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
                    {!esBusqueda&&(
                      <span className="search-topic-number">
                        {temaIndex+1}) 
                      </span>
                    )}
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
        )}
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
        {mostrarListaInicial&&
          !cursoSeleccionado&&(
            <div className="search-results">
              {gruposIniciales.map(
                (g,grupoIndex)=>
                  renderGrupo(
                    g,
                    grupoIndex,
                    false,
                    false
                  )
              )}
            </div>
          )}
        {mostrarListaInicial&&
          cursoSeleccionado&&
          grupoCursoSeleccionado&&(
            <div className="search-results">
              {renderGrupo(
                grupoCursoSeleccionado,
                0,
                false,
                true
              )}
            </div>
          )}
        {mostrarResultados&&
          cursoBusquedaSeleccionado&&
          grupoCursoSeleccionado&&(
            <div className="search-results">
              {renderGrupo(
                grupoCursoSeleccionado,
                0,
                false,
                true
              )}
            </div>
          )}
        {mostrarResultados&&
          !cursoBusquedaSeleccionado&&
          grupos.length>0&&(
            <div className="search-results">
              {grupos.map(
                (g,grupoIndex)=>
                  renderGrupo(
                    g,
                    grupoIndex,
                    true,
                    true
                  )
              )}
            </div>
          )}
        {mostrarResultados&&
          !cursoBusquedaSeleccionado&&
          grupos.length===0&&
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
          !cursoBusquedaSeleccionado&&
          buscandoSemantica&&
          grupos.length===0&&(
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