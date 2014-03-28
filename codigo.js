var estados = ['m-nocursada', 'm-cursada', 'm-aprobada'];
var estadosDOM = ['(no cursada)', '(regular)', '(aprobada)'];
var condiciones = ['m-nocursable', 'm-cursable', 'm-aprobable'];
var materias = new Array();
var hrsObligTot = 0;
var hrsObligAct = 0;
var hrsElectTot = 0;
var hrsElectAct = 0;
var hrsCursadas = 0;
var matAprobads = 0;
var excepcion;

$(document).ready(function() {
    if (!localStorage.getItem("co-materias")) {
        if (window.location.hash) {
            var nomPlan = window.location.hash.substring(1);
        } else {
            var nomPlan = "isi08";
        }
        var script = document.createElement('script');
        script.src = nomPlan+".js";
        document.body.appendChild(script);
    } else {
        cargarLocal();
    }
});

function cargarLocal() {
    hrsElectTot = parseInt(localStorage.getItem("co-elect"));
    materias = JSON.parse(localStorage.getItem("co-materias"));
    var i;
    for (i=1; i<materias.length; i++) {
        hrsObligTot += materias[i].hrs;
        if (materias[i].est >= 1) {
            hrsCursadas += materias[i].hrs;
            if (materias[i].est == 2) {
                hrsObligAct += materias[i].hrs;
                matAprobads++;
            }
        }
    }
    iniciar();
    excepcion.checked = ("true" == localStorage.getItem("co-excepcion"));
    electivas = JSON.parse(localStorage.getItem("co-electivas"));
    i = 0;
    while (i < electivas.length)
        crearElectiva(electivas[i++], electivas[i++]);
}

function cargarPlan(hrsElectivas, plan) {
    hrsElectTot = hrsElectivas;
    for (var i=0; i<plan.length; i++) {
        for (var j=0; j<plan[i].length; j++) {
            var condicion;
            if (plan[i][j].cpc.length==0 && plan[i][j].apc.length==0) {
                if (plan[i][j].apr.length==0) {
                    condicion = 2;
                } else {
                    condicion = 1;
                }
            } else {
                condicion = 0;
            }
            var cascada = new Array();
            var mat = plan[i][j];
            for (var k=i; k<plan.length; k++) {
                for (var l=0; l<plan[k].length; l++) {
                    var cor = plan[k][l];
                    if ($.inArray(mat.ord, cor.cpc)!=-1 || $.inArray(mat.ord, cor.apc)!=-1 || $.inArray(mat.ord, cor.apr)!=-1) {
                        cascada.push(cor.ord);
                    }
                }
            }
            hrsObligTot += mat.hrs;
            materias[mat.ord] = new Materia(mat.nom, i+1, mat.hrs, condicion, 0, mat.cpc, mat.apc, mat.apr, cascada);
        }
    }
    iniciar();
}

function iniciar() {
    dibujarMaterias();
    modificarProgreso(0, 0);
    modificarCursadas(0);
    $("#sp-obltot").text(hrsObligTot);
    $("#sp-eletot").text(hrsElectTot);
    $('#bt-newElect').click(function() {
        var nombre = $("#in-nomElect").val();
        var horas = parseInt($("#sl-hrsElect").val());
        crearElectiva(nombre, horas);
        $("#in-nomElect").val('');
    });
    $('#bt-guardar').click(function() {
        localStorage.setItem("co-materias", JSON.stringify(materias));
        localStorage.setItem("co-elect", hrsElectTot.toString());
        localStorage.setItem("co-excepcion", excepcion.checked.toString());
        var electivas = new Array();
        $("#electivas li").each(function(){
            electivas.push($(this).data("nombre"));
            electivas.push($(this).data("horas"));
        });
        localStorage.setItem("co-electivas", JSON.stringify(electivas));
        alert("Los datos fueron guardados satisfactoriamente.");
    });
    $('#bt-borrar').click(function() {
        localStorage.removeItem("co-materias");
        localStorage.removeItem("co-electivas");
        localStorage.removeItem("co-elect");
        localStorage.removeItem("co-excepcion");
        alert("Los datos fueron limpiados de su navegador.");
    });
    $("#cb-excepcion").change(function(){
        cambioExcepcion();
    });
}

function Materia(nomb, anio, hors, cond, estd, cucu, apcu, apre, casc) {
    this.nom = nomb;
    this.ano = anio;
    this.hrs = hors;
    this.con = cond;
    this.est = estd;
    this.cpc = cucu;
    this.apc = apcu;
    this.apr = apre;
    this.cas = casc;
}

function dibujarMaterias() {
    var anoDOM;
    for (var i=1; i<materias.length; i++) {
        var mat = materias[i];
        anoDOM = 'ano-' + mat.ano;
        if (!document.getElementById(anoDOM)) {
            var newAno = '<div class="container"><div class="container-title">'+mat.ano+
                         '° año</div><ul class="materias" id="'+anoDOM+'"></ul></div>';
            $(newAno).appendTo("#obligatorias");
        }
        var matJQ = $('<li id="materia-'+i+'">');
        matJQ.addClass(condiciones[mat.con]);
        matJQ.addClass(estados[mat.est]);
        matJQ.data("id", i);
        $('<span class="nombre-mat">'+materias[i].nom+'</span>').appendTo(matJQ);
        $('<span class="estado-mat">'+estadosDOM[materias[i].est]+'</span>').appendTo(matJQ);
        matJQ.appendTo('#'+anoDOM);
        matJQ.click(function() {
            var idMateria = $(this).data("id");
            var estado = (materias[idMateria].est + 1) % 3;
            setEstado(idMateria, estado);
        });
    }
    $('#'+anoDOM).after('<div class="container-body"><form><label for="cb-excepcion">'+
                      '<input id="cb-excepcion" type="checkbox" disabled>'+
                      'Pedir excepción</label></form></div>');
    excepcion = document.getElementById("cb-excepcion");
}

function setEstado(idMateria, nuevoEstado) {
    var materia = materias[idMateria];
    var viejoEstado = materia.est;
    if (nuevoEstado == viejoEstado) {
        return null;
    } else if (nuevoEstado <= materia.con) {
        materia.est = nuevoEstado;
        if (viejoEstado==0) {
            if (nuevoEstado>=1)
                modificarCursadas(materia.hrs);
            if (nuevoEstado==2)
                modificarProgreso(materia.hrs, 0);
        } else if (viejoEstado==1) {
            if (nuevoEstado==0)
                modificarCursadas(-materia.hrs);
            else if (nuevoEstado==2)
                modificarProgreso(materia.hrs, 0);
        } else if (viejoEstado==2) {
            if (nuevoEstado<=1)
                modificarProgreso(-materia.hrs, 0);
            if (nuevoEstado==0)
                modificarCursadas(-materia.hrs);
        }
        var materiaDOM = '#materia-' + idMateria;
        var materiaJS = $(materiaDOM);
        materiaJS.removeClass();
        materiaJS.addClass(condiciones[materia.con]);
        materiaJS.addClass(estados[nuevoEstado]);
        $(materiaDOM+' .estado-mat').text(estadosDOM[nuevoEstado]);
        var lista = materia.cas;
        for (var i=0; i<lista.length; i++) {
            calcularCondicion(lista[i]);
        }
    } else if (viejoEstado == 0) {
        alert("Todavía no puede cursar esta materia.");
    } else {
        setEstado(idMateria, 0);
    }
}

function setCondicion(idMateria, nuevaCond) {
    var materia = materias[idMateria];
    materia.con = nuevaCond;
    if (nuevaCond < materia.est) {
        setEstado(idMateria, nuevaCond);
    } else {
        var materiaDOM = '#materia-' + idMateria;
        var materiaJS = $(materiaDOM);
        materiaJS.removeClass();
        materiaJS.addClass(condiciones[materia.con]);
        materiaJS.addClass(estados[materia.est]);
    }
}

function calcularCondicion(id) {
    var condicion = 0;
    var cursable = true;
    var lista;
    if (!excepcion.checked) {
        lista = materias[id].cpc;
        for (var i=0; i<lista.length; i++)
            cursable = cursable && (materias[lista[i]].est != 0);
        lista = materias[id].apc;
        for (var i=0; i<lista.length; i++)
            cursable = cursable && (materias[lista[i]].est == 2);
    }
    if (excepcion.checked || cursable) {
        var aprobable = true;
        lista = materias[id].apr;
        for (var i=0; i<lista.length; i++) {
            aprobable = aprobable && (materias[lista[i]].est == 2);
        }
        if (aprobable) {
            condicion = 2;
        } else {
            condicion = 1;
        }
    }
    if (condicion != materias[id].con) {
        setCondicion(id, condicion);
    }
}

function modificarProgreso(hrsObl, hrsEle) {
    hrsObligAct += hrsObl;
    hrsElectAct += hrsEle;
    if (hrsObl > 0)
        matAprobads++;
    else if (hrsObl < 0)
        matAprobads--;
    if (hrsEle > 0)
        matAprobads++;
    else if (hrsEle < 0)
        matAprobads--;
    var hrsAct = hrsObligAct;
    if (hrsElectAct < hrsElectTot)
        hrsAct += hrsElectAct;
    else
        hrsAct += hrsElectTot;
    var progreso = hrsAct / (hrsObligTot+hrsElectTot) * 100;
    $("#sp-oblact").text(hrsObligAct);
    $("#sp-eleact").text(hrsElectAct);
    $("#sp-matapr").text(matAprobads);
    $("#sp-progreso").text(progreso.toFixed(2));
}

function modificarCursadas(hrsCur) {
    hrsCursadas += hrsCur;
    $("#sp-curact").text(hrsCursadas);
    if (excepcion.disabled){
        if (hrsObligTot-hrsCursadas <= 60) {
            excepcion.disabled = false;
        }
    } else {
        if (hrsObligTot-hrsCursadas > 60) {
            excepcion.disabled = true;
            excepcion.checked = false;
            cambioExcepcion();
        }
    }
}

function cambioExcepcion() {
    for (var i=1; i<materias.length; i++)
        calcularCondicion(i);
}

function crearElectiva(nombre, horas) {
    try {
        if (!nombre || nombre.length===0)
            throw "Ingrese un nombre.";
        if (!horas)
            throw "Ingrese las horas.";
        var matJQ = $("<li>");
        matJQ.addClass(condiciones[2]);
        matJQ.addClass(estados[2]);
        matJQ.data("horas", horas);
        matJQ.data("nombre", nombre);
        $('<span class="nombre-mat">'+nombre+'</span>').appendTo(matJQ);
        $('<span class="estado-mat">('+horas+' horas)</span>').appendTo(matJQ);
        matJQ.appendTo('#electivas');
        modificarProgreso(0, horas);
        matJQ.click(function() {
            var horas = $(this).data("horas");
            modificarProgreso(0, -horas);
            $(this).remove();
        });
    } catch(err) {
        alert("Error: "+err);
    }
}