importScripts('/static/js/lib/topojson-client.2.1.0.min.js');
onmessage = function(e) {
  let [topo_to_use, layer, field, discontinuity_type, discretization_type] = e.data;
  console.log([topo_to_use, layer, field, discontinuity_type, discretization_type]);
  let result_value = new Map(),
      topo_mesh = topojson.mesh,
      math_max = Math.max;

  if(discontinuity_type == "rel")
      topo_mesh(topo_to_use, topo_to_use.objects[layer], function(a, b){
              if(a !== b){
                  let new_id = [a.id, b.id].join('_'),
                      new_id_rev = [b.id, a.id].join('_');
                  if(!(result_value.get(new_id) || result_value.get(new_id_rev))){
                      let value = math_max(a.properties[field] / b.properties[field],
                                           b.properties[field] / a.properties[field]);
                      result_value.set(new_id, value);
                  }
              }
              return false; });
  else
      topo_mesh(topo_to_use, topo_to_use.objects[layer], function(a, b){
              if(a !== b){
                  let new_id = [a.id, b.id].join('_'),
                      new_id_rev = [b.id, a.id].join('_');
                  if(!(result_value.get(new_id) || result_value.get(new_id_rev))){
                      let value = math_max(a.properties[field] - b.properties[field],
                                           b.properties[field] - a.properties[field]);
                      result_value.set(new_id, value);
                  }
              }
              return false; });

  let arr_disc = [],
      arr_tmp = [];
  for(let kv of result_value.entries()){
      if(!isNaN(kv[1])){
          arr_disc.push(kv);
          arr_tmp.push(kv[1]);
      }
  }

  arr_disc.sort((a,b) => a[1] - b[1]);
  arr_tmp.sort((a,b) => a - b);

  var nb_ft = arr_disc.length,
      d_res = [];
  for(let i=0; i<nb_ft; i++){
      let id_ft = arr_disc[i][0],
          val = arr_disc[i][1],
          datum = topo_mesh(topo_to_use, topo_to_use.objects[layer], function(a, b){
              let a_id = id_ft.split("_")[0], b_id = id_ft.split("_")[1];
              return a != b
                  && (a.id == a_id && b.id == b_id || a.id == b_id && b.id == a_id); });
      d_res.push([val, {id: id_ft, disc_value: val}, datum]);
  }
  d_res.sort((a,b) => b[0] - a[0]);
  postMessage([arr_tmp, d_res]);
}
