//Adaugare EventListener la incarcarea paginii verificarea valorii judetului
window.addEventListener("load", start, false);

function start(){

document.getElementById('combo1').addEventListener('change', function(){
  var option = document.createElement("option");
  option.text = document.getElementById('combo1').value;
  document.getElementById('combo1').remove(option);
  document.getElementById('combo2').add(option);
  
}, false);

document.getElementById('combo2').addEventListener('change', function(){
  var option2 = document.createElement("option");
  option2.text = document.getElementById('combo2').value;
  document.getElementById('combo2').remove(option2);
  document.getElementById('combo1').add(option2);
  
}, false);

}