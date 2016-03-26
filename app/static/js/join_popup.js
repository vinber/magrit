function handle_join(){
    var layer_name = Object.getOwnPropertyNames(user_data);
    if(!(layer_name.length === 1
            && joined_dataset.length === 1)){
        alert("Unable to join geometries and dataset")
        return;
      }
    else if(user_data[layer_name].length != joined_dataset[0].length){
        alert("The geometrie layer and the joined dataset doesn't have the same number of features");
        return;
      }
    var popid = layer_name,
        modal = createJoinBox(popid);
//    modalback.className = 'active';
    modal.className += ' active';
    modal.style.position = 'fixed'
    modal.style.zIndex = 1;
   return center(modal);
};

function createJoinBox(modalid, html){
     var nwBox = document.createElement('div');
     var bg = document.createElement('div');
     var g_lyr_name = "#"+trim(modalid);

     bg.className = 'overlay';
     nwBox.id = modalid;
     nwBox.className = 'popup';
     nwBox.innerHTML = ['<!DOCTYPE html>',
                        '<p style="font:16px bold;text-align:center">Join option</p><br>',
                        'Layer name : <p style="font: 14px courrier bold; display:inline;">', modalid, '<br>',
                        '<p><b><i>Select fields on which operate the join :</i></b></p>',
                        '<p>Geometrie layer fields :',
                        '<p>External dataset fields :',
                        '<br><br><br><p style="text-align:center;font: bold">Join datasets ?</p>',
                        '<p><button id="yes">Apply</button>',
                        '&nbsp;<button id="no">Cancel</button></p>'].join('');

     (document.body || document.documentElement).appendChild(nwBox);
     (document.body || document.documentElement).appendChild(bg);

     qs('#yes').onclick=function(){
         deactivate([nwBox, bg]);
     }
     qs('#no').onclick=function(){
         deactivate([nwBox, bg]);
     }
     return nwBox;
}
