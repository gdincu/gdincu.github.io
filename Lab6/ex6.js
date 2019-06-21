//Adaugare EventListener la incarcarea paginii verificarea valorii judetului
window.addEventListener("load", start, false);

document.getElementById('rez').innerHTML = 0;

function start(){

document.getElementById('deMiscat').addEventListener('mouseover', function(event){
  
document.getElementById('rez').innerHTML += 1;

}, false);

}