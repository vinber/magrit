function createBoxTextImportWizard(){
  var modal_box = make_dialog_container(
      "box_text_import_wizard",
      i18next.t("app_page.box_text_import.title"),
      "dialog");

  let box_content = d3.select("#box_text_import_wizard").select(".modal-body");
  let a = new TextImportWizard(box_content.node());
  let deferred = Q.defer(),
      container = document.getElementById("box_text_import_wizard"),
      fn_cb = (evt) => { helper_esc_key_twbs(evt, _onclose); };
      _onclose = () => {
          deferred.resolve(false);
          modal_box.close();
          container.remove();
          overlay_under_modal.hide();
          document.removeEventListener('keydown', fn_cb);
      };
  container.querySelector(".btn_cancel").onclick = _onclose;
  container.querySelector("#xclose").onclick = _onclose;
  container.querySelector(".btn_ok").onclick = function(){
      deferred.resolve(true);
      modal_box.close();
      container.remove();
      overlay_under_modal.hide();
      document.removeEventListener('keydown', fn_cb);
  };
  document.addEventListener('keydown', fn_cb);
  overlay_under_modal.display();

  return deferred.promise;
}

 // let encoding = jschardet.detect(data);
 // if(encoding.encoding != "utf-8"
 //         || encoding.confidence){
 //     console.log(encoding);
 //    //  Todo : do something in order to get a correct encoding
 // }

function firstGuessSeparator(line){
    if(line.indexOf('\t') > -1){
        return 'tab';
    } else if(line.indexOf(';') > -1){
        return 'semi-collon';
    } else {
        return 'comma';
    }
}

function helper_esc_key_twbs(evt, callback){
      evt = evt || window.event;
      let isEscape = ("key" in evt) ? (evt.key == "Escape" || evt.key == "Esc") : (evt.keyCode == 27);
      if (isEscape) {
        evt.stopPropagation();
        if(callback){
            callback();
        }
      }
}

class TextImportWizard {
    constructor(parent_element, file_txt){
        if(!parent_element)
            parent_element = document.body;
        if(!file_txt){
            file_txt = new File(['id;val1;val2\r\n"foo";2;3\r\n"bar";5;6\r\n'], "filename.csv");
        }
        let self = this;
        self.delim_char = {"tab": "\t", "comma": ",", "semi-collon": ";", "space": " "};
        let handle_change_delimiter = () => {
            let buttons = document.getElementsByName('txtwzrd_delim_char'),
                n_buttons = buttons.length,
                delim;
            for(let i = 0; i < n_buttons; i++){
                if(buttons[i].checked)
                  delim = self.delim_char[buttons[i].value];
            }
            if(delim)
                self.change_delimiter(delim);
        }
        let html_content = "<div>" +
            "<p style=\"font-weight: bold;\"><span>Import</span><span style=\"float: right;\" id=\"txtwzrd_filename\"></span></p>" +
            "<p><span>Encodage</span><select id=\"txtwzrd_encoding\" style=\"position: absolute; left: 200px;\"></select></p>" +
            "<p><span>A partir de la ligne</span><input style=\"position: absolute; left: 200px;width: 60px;\" type=\"number\" value=\"1\" min=\"1\" step=\"1\" id=\"txtwzrd_from_line\"/></p>" +
            "</div>" +
            "<div>" +
            "<p style=\"font-weight: bold;\"><span>Délimiteur</span></p>" +
            // "<p><input type=\"radio\" name=\"txtwzrd_radio_delim\" value=\"fixed\">Taille de colonne fixe</input><input type=\"radio\" name=\"txtwzrd_radio_delim\" value=\"char\">Caractère</input></p>" +
            "<p><input type=\"radio\" name=\"txtwzrd_delim_char\" value=\"tab\" style=\"margin-left: 10px;\">Tabulation</input>" +
            "<input type=\"radio\" name=\"txtwzrd_delim_char\" value=\"comma\" style=\"margin-left: 10px;\">Virgule</input>" +
            "<input type=\"radio\" name=\"txtwzrd_delim_char\" value=\"semi-collon\" style=\"margin-left: 10px;\">Point-virgule</input>" +
            "<input type=\"radio\" name=\"txtwzrd_delim_char\" value=\"space\" style=\"margin-left: 10px;\">Espace</input></p>" +
            "<p><span>Séparateur de texte</span><select id=\"txtwzrd_encoding\" style=\"position: absolute; left: 200px;\"><option value=\"&quot;\">&quot;</option><option value=\"'\">'</option></select></p>" +
            "</div>" +
            "<div style=\"max-height: 160px;\">" +
            "<p style=\"font-weight: bold;\"><span>Table</span></p>" +
            "<table id=\"txtwzr_table\" style=\"font-size: 14px; margin: 0 5px 0 5px;\"><thead></thead><tbody></tbody>";
        let div_content = document.createElement('div');
        div_content.setAttribute('class', '.txtwzrd_box_content');
        div_content.style = "minWidth: 400px; maxWidth: 600px; minHeight: 400px; maxHeight: 600px";
        div_content.innerHTML = html_content;
        parent_element.appendChild(div_content);
        parent_element.querySelector('#txtwzrd_filename').innerHTML = file_txt.name;
        parent_element.querySelector('#txtwzrd_from_line').onchange = function(){
            let val = +this.value;
            if(isNaN(val) || val < 1 || (val | 0) != val){
                this.value = self.from_line;
            } else {
                self.change_first_line(val);
            }
        }
        Array.prototype.forEach.call(
            document.getElementsByName('txtwzrd_delim_char'),
            el => { el.onclick = handle_change_delimiter });
        this.content = div_content;
        this.table = div_content.querySelector('table');
        this.file = file_txt;
        this.readed_text = null;
        this.encoding = document.characterSet;
        this.delimiter = undefined;
        this.from_line = 1;
        this.line_separator = undefined;
        self.add_encodage_to_selection([self.encoding]);
        self.read_file_to_text({first_read: true, update: true});
    }

    add_encodage_to_selection(encodage){
        let select = this.content.querySelector('#txtwzrd_encoding');
        if(typeof encodage == "string")
            encodage = [encodage];
        for(let i = 0; i < encodage.length; i++){
            let o = document.createElement('option');
            o.value = encodage[i];
            o.innerText = encodage[i];
            select.append(o);
        }
    }

    set_first_guess_delimiter(){
        let self = this;
        let delim = firstGuessSeparator(self.readed_text.split(self.line_separator));
        self.delimiter = self.delim_char[delim]
        Array.prototype.forEach.call(document.getElementsByName('txtwzrd_delim_char'), el => {
            if(el.value == delim){
                el.checked = true;
              }
        })
    }

    set_line_separator(){
        this.line_separator = this.readed_text.indexOf('\r\n') > -1 ? '\r\n' : '\n';
    }

    read_file_to_text(options = {}){
        let self = this;
        let reader = new FileReader();
        reader.onloadend = function(){
            self.readed_text = reader.result;
            if(options.first_read == true){
                self.set_line_separator();
                self.set_first_guess_delimiter();
            }
            if(options.update == true){
                self.update_table();
            }
        }
        reader.readAsText(self.file, self.encoding);
    }

    change_first_line(from_line){
        let self = this;
        self.from_line = from_line;
        self.update_table();
    }

    change_delimiter(new_delim){
        let self = this;
        self.delimiter = new_delim;
        self.update_table();
    }

    update_table(){
        let self = this;
        let doc = document;

        self.table.innerHTML = "<thead></thead><tbody></tbody>";

        let lines = self.readed_text.split('\r\n');
        let header_line = lines[self.from_line - 1].split(self.delimiter);
        let tmp_nb_fields = header_line.length;

        let headers = self.table.querySelector('thead');
        let headers_row = doc.createElement("tr");

        for(let i=0; i < tmp_nb_fields; i++){
            let cell = doc.createElement("th");
            cell.innerHTML = header_line[i];
            headers_row.appendChild(cell);
        }
        headers.append(headers_row);
        let tbody = self.table.querySelector('tbody');
        lines = lines.slice(self.from_line);
        let length_table = lines.length < 10 ? lines.length : 10;
        for(let i=0; i < lines.length; i++){
            let row = doc.createElement("tr");
            let values = lines[i].split(self.delimiter);
            if(tmp_nb_fields != values.length){
                return;
            }
            for(let j=0; j < tmp_nb_fields; j++){
                let cell = doc.createElement("td");
                cell.innerHTML = values[j]
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
    }
}
