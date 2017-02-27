"use strict";

/**
* Return a basic operator as a function, each one taking two numbers in arguments
*
* @param {String} operator
* @return {function}
*/
function get_fun_operator(operator){
    let operators = new Map([
        ["+", function(a, b){ return a + b; }],
        ["-", function(a, b){ return a - b; }],
        ["/", function(a, b){ if(b === 0){ return ""; } else { return a / b; } }],
        ["*", function(a, b){ return a * b; }],
        ["^", function(a, b){ return Math.pow(a, b); }],
    ]);
    return operators.get(operator);
}


/**
* Function to add a field to the targeted layer
*
* @param {Array} table - A reference to the "table" to work on
* @param {String} layer - The name of the layer
* @param {Object} parent - A reference to the parent box in order to redisplay the table according to the changes
*
*/
function add_field_table(table, layer_name, parent){
    function check_name(){
        if(regexp_name.test(this.value) || this.value == "")
            chooses_handler.new_name = this.value;
        else { // Rollback to the last correct name  :
            this.value = chooses_handler.new_name;
            swal({title: i18next.t("Error") + "!",
                  text: i18next.t("Unauthorized character!"),
                  type: "error",
                  allowOutsideClick: false});
        }
    };

    function compute_and_add(){
        let options = chooses_handler,
            fi1 = options.field1,
            fi2 = options.field2,
            new_name_field = options.new_name,
            operation = options.operator,
            opt_val = options.opt_val;

        if(!regexp_name.test(new_name_field)){
            swal({title: "",
                  text: i18next.t("app_page.explore_box.add_field_box.invalid_name"),
                  type: "error",
                  allowOutsideClick: false});
            return Promise.reject("Invalid name");
        }

        if(options.type_operation === "math_compute" && table.length > 3200){
            let formToSend = new FormData();
            let var1 = [],
                var2 = (fi2 == "user_const_value") ? +opt_val : [];
            for(let i=0; i<table.length; i++){
                var1.push(+table[i][fi1])
            }
            if(fi2 != "user_const_value"){
                for(let i=0; i<table.length; i++){
                    var2.push(+table[i][fi2])
                }
            }
            formToSend.append('var1', JSON.stringify(var1));
            formToSend.append('var2', JSON.stringify(var2));
            formToSend.append('operator', operation);
            return xhrequest("POST", "/helpers/calc", formToSend, false).then(function(data){
                data = JSON.parse(data);
                for(let i=0; i<table.length; i++)
                    table[i][new_name_field] = data[i];

                return true;
            });
        }
        else if(options.type_operation === "math_compute"){
            let math_func = get_fun_operator(operation)
            if(fi2 != "user_const_value"){
                for(let i=0; i<table.length; i++){
                    if(table[i][fi1] != null && table[i][fi1] != "" && table[i][fi2] != null && table[i][fi2] != ""){
                        table[i][new_name_field] = math_func(+table[i][fi1], +table[i][fi2]);
                    } else {
                        table[i][new_name_field] = "";
                    }
                }
            } else {
                opt_val = +opt_val;
                for(let i=0; i<table.length; i++){
                    if(table[i][fi1] != null && table[i][fi1] != ""){
                        table[i][new_name_field] = math_func(+table[i][fi1], opt_val);
                    } else {
                        table[i][new_name_field] = "";
                    }
                }
            }
            return Promise.resolve(true);
        } else {
            if(operation == "truncate"){
                opt_val = +opt_val;
                if(opt_val >= 0){
                    for(let i=0; i < table.length; i++)
                        table[i][new_name_field] = table[i][fi1].substring(0, opt_val);
                } else {
                    for(let i=0; i < table.length; i++)
                        table[i][new_name_field] = table[i][fi1].substr(opt_val);
                }
            } else if (operation == "concatenate"){
                for(let i=0; i < table.length; i++)
                    table[i][new_name_field] = [table[i][fi1], table[i][fi2]].join(opt_val);
            }
            return Promise.resolve(true);
        }
        return Promise.reject("Unknown error")
    };


    function refresh_type_content(type){
        field1.node().remove(); operator.node().remove(); field2.node().remove();
        field1 = div1.append("select")
            .on("change", function(){ chooses_handler.field1 = this.value; });
        operator = div1.append("select")
            .on("change", function(){
                chooses_handler.operator=this.value;
                refresh_subtype_content(chooses_handler.type_operation, this.value);
              });
        field2 = div1.append("select")
            .on("change", function(){
                chooses_handler.field2 = this.value;
                if(this.value == "user_const_value"){
                    val_opt.style("display", null);
                }
            });
        if(type == "math_compute"){
            math_operation.forEach(function(op){ operator.append("option").text(op).attr("value", op); })
            for(let k in fields_type){
                if(fields_type[k] == "number"){
                    field1.append("option").text(k).attr("value", k);
                    field2.append("option").text(k).attr("value", k);
                }
            }
            field2.append("option")
                .attr("value", "user_const_value")
                .text(i18next.t("app_page.explore_box.add_field_box.constant_value"));
            val_opt.style("display", "none");
            txt_op.text("");
            chooses_handler.operator = math_operation[0];
        } else {
            string_operation.forEach(function(op){
                operator.append("option").text(op[0]).attr("value", op[1]);
            })
            for(let k in fields_type){
                if(fields_type[k] == "string"){
                    field1.append("option").text(k).attr("value", k);
                    field2.append("option").text(k).attr("value", k);
                }
            }
            val_opt.style("display", null);
            txt_op.html(i18next.t("app_page.explore_box.add_field_box.join_char"));
            chooses_handler.operator = string_operation[0];
        }
        chooses_handler.field1 = field1.node().value;
        chooses_handler.field2 = field2.node().value;
    };

    function refresh_subtype_content(type, subtype){
        if(type != "string_field"){
            if(field2.node().value != "user_const_value"){
                val_opt.style("display", "none");
                txt_op.text("");
            }
        } else {
            if(subtype == "truncate"){
                txt_op.html(i18next.t("app_page.explore_box.add_field_box.keep_char"));
                field2.attr("disabled", true);
            } else {
                txt_op.html("app_page.explore_box.add_field_box.join_char");
                field2.attr("disabled", null);
            }
        }
    };

    var chooses_handler = {
        field1: undefined, field2: undefined,
        operator: undefined, type_operation: undefined,
        opt_val: undefined, new_name: 'NewFieldName'
        }

    make_confirm_dialog2("addFieldBox", i18next.t("app_page.explore_box.button_add_field"),
                    {width: 430 < w ? 430 : undefined, height: 280 < h ? 280 : undefined}
        ).then(function(valid){
            reOpenParent("#browse_data_box");
            if(valid){
                document.querySelector("body").style.cursor = "wait";
                compute_and_add(chooses_handler).then(
                    function(resolved){
                        if(current_layers[layer_name].targeted){
                            current_layers[layer_name].fields_type.push(type_col2(user_data[layer_name], chooses_handler.new_name)[0]);
                            if(window.fields_handler){
                                fields_handler.unfill();
                                fields_handler.fill(layer_name);
                            }
                        }
                        if(parent){
                            parent.display_table(layer_name);
                        }
                    }, function(error){
                        if(error != "Invalid name")
                            display_error_during_computation();
                        console.log(error);
                        document.querySelector("body").style.cursor = "";
                }).done(()=> { document.querySelector("body").style.cursor = ""; });
            }
        });

    var current_fields = Object.getOwnPropertyNames(table),
        fields_type = type_col(layer_name),
        regexp_name = new RegExp(/^[a-z0-9_]+$/i), // Only allow letters (lower & upper cases), number and underscore in the field name
        box_content = d3.select(".addFieldBox").select(".modal-body").append("div"),
        div1 = box_content.append("div").attr("id", "field_div1"),
        div2 = box_content.append("div").attr("id", "field_div2");

    var new_name = div1.append("p")
        .html(i18next.t("app_page.explore_box.add_field_box.new_name"))
        .insert("input").attr('value', 'NewFieldName')
        .on("keyup", check_name);
    var type_content = div1.append("p")
        .html(i18next.t("app_page.explore_box.add_field_box.new_content"))
        .insert("select").attr("id", "type_content_select")
        .on("change", function(){
            chooses_handler.type_operation = this.value;
            refresh_type_content(this.value);
        });

    [[i18next.t("app_page.explore_box.add_field_box.between_numerical"), "math_compute"],
     [i18next.t("app_page.explore_box.add_field_box.between_string"), "string_field"]
    ].forEach(function(d,i){
        type_content.append("option").text(d[0]).attr("value", d[1]);
    });

    var field1 = div1.append("select").on("change", function(){ chooses_handler.field1 = this.value; }),
        operator = div1.append("select").on("change", function(){
                            chooses_handler.operator = this.value;
                            refresh_subtype_content(chooses_handler.type_operation, this.value);
                            }),
        field2 = div1.append("select").on("change", function(){ chooses_handler.field2 = this.value; });

    var txt_op = div2.append("p").attr("id", "txt_opt").text(""),
        val_opt = div2.append("input").attr("id", "val_opt")
                        .style("display", "none")
                        .on("change", function(){ chooses_handler.opt_val = this.value;});

    var math_operation = ["+", "-", "*", "/", "^"];

    var string_operation = [
         [i18next.t("app_page.explore_box.add_field_box.concatenate"), "concatenate"],
         [i18next.t("app_page.explore_box.add_field_box.truncate"), "truncate"]
        ];
    {
        let a = type_content.node(),
            b = false;
        for(let fi in fields_type){
            if(fields_type[fi] == "number"){
                b = true;
                break;
            }
        }
        a.value = b ? "math_compute" : "string_field";
        a.dispatchEvent(new Event('change'));
    }
    return;
}

function createTableDOM(data, options){
    options = options || {};
    options.id = options.id || "myTable";
    let doc = document,
        nb_features = data.length,
        column_names = Object.getOwnPropertyNames(data[0]),
        nb_columns = column_names.length;
    let myTable = doc.createElement("table"),
        headers = doc.createElement("thead"),
        body = doc.createElement("tbody"),
        headers_row = doc.createElement("tr");
    for(let i=0; i < nb_columns; i++){
        let cell = doc.createElement("th");
        cell.innerHTML = column_names[i];
        headers_row.appendChild(cell)
    }
    headers.appendChild(headers_row);
    myTable.appendChild(headers);
    for(let i=0; i < nb_features; i++){
        let row = doc.createElement("tr");
        for(let j=0; j < nb_columns; j++){
            let cell = doc.createElement("td");
            cell.innerHTML = data[i][column_names[j]]
            row.appendChild(cell);
        }
        body.appendChild(row);
    }
    myTable.appendChild(body);
    myTable.setAttribute("id", options.id);
    return myTable;
}

function make_table(layer_name){
    let features = svg_map.querySelector("#" + _app.layer_to_id.get(layer_name)).childNodes,
        table = [];
    if(!features[0].__data__.properties
            || Object.getOwnPropertyNames(features[0].__data__.properties).length === 0){
        for(let i=0, nb_ft = features.length; i < nb_ft; i++){
                table.push({id: features[i].__data__.id || i});
            }
    } else {
        for(let i=0, nb_ft = features.length; i < nb_ft; i++){
            table.push(features[i].__data__.properties);
        }
    }
    return table;
}

var boxExplore2 = {
    display_table: function(table_name){
        document.querySelector("body").style.cursor = "";
        let the_table = this.tables.get(table_name);
        the_table = the_table ? the_table[1] : make_table(table_name);

        this.nb_features = the_table.length;
        this.columns_names = Object.getOwnPropertyNames(the_table[0]);
        this.columns_headers = [];
        for(let i=0, col=this.columns_names, len = col.length; i<len; ++i)
            this.columns_headers.push({data: col[i], title: col[i]});
        if(this.top_buttons.select("#add_field_button").node()){
            this.top_buttons.select("#add_field_button").remove()
            document.getElementById("table_intro").remove();
            document.querySelector(".dataTable-wrapper").remove();
        }

        // TODO : allow to add_field on all the layer instead of just targeted / result layers :
        if(this.tables.get(table_name)){
          this.top_buttons
              .insert("button")
              .attrs({id: "add_field_button", class: "button_st3"})
              .html(i18next.t("app_page.explore_box.button_add_field"))
              .on('click', () => {
                  add_field_table(the_table, table_name, this);
               });
        }
        let txt_intro = [
             "<b>", table_name, "</b><br>",
             this.nb_features, " ", i18next.t("app_page.common.feature", {count: this.nb_features}), " - ",
             this.columns_names.length, " ", i18next.t("app_page.common.field", {count: this.columns_names.length})
            ].join('');
        this.box_table.append("p").attr('id', 'table_intro').html(txt_intro);
        this.box_table.node().appendChild(
            createTableDOM(the_table, {id: "myTable"})
            );

        let myTable = document.getElementById("myTable");
        this.datatable = new DataTable(myTable,{
        	sortable: true,
        	searchable: true,
        	fixedHeight: true,
        });
            // Adjust the size of the box (on opening and after adding a new field)
            // and/or display scrollbar if its overflowing the size of the window minus a little margin :
        setTimeout(function(){
            let box = document.getElementById("browse_data_box");
            // box.querySelector(".dataTable-pagination").style.width = "80%";
            let bbox = box.querySelector("#myTable").getBoundingClientRect(),
                new_width = bbox.width,
                new_height = bbox.height + box.querySelector(".dataTable-pagination").getBoundingClientRect().height;

            if(new_width > window.innerWidth * 0.85){
                box.querySelector(".modal-content").style.overflow = "auto";
                box.querySelector(".modal-dialog").style.width = window.innerWidth * 0.9 + "px";
            } else if (new_width > 560) {
                box.querySelector(".modal-dialog").style.width = (new_width + 80) + "px";
            }

            if (new_height > 350 || new_height > window.innerHeight * 0.80 ) {
                box.querySelector(".modal-body").style.height = (new_height + 175) + "px";
                box.querySelector(".modal-body").style.overflow = "auto";
            }
            setSelected(document.querySelector(".dataTable-selector"), "10");
            // let datatable_info = box.querySelector(".dataTable-bottom");
            // box.querySelector(".modal-footer").insertBefore(datatable_info, box.querySelector(".btn_ok"));
        }, 225);
    },
    get_available_tables: function(){
        let target_layer = Object.getOwnPropertyNames(user_data),
            ext_dataset = dataset_name,
            result_layers = Object.getOwnPropertyNames(result_data),
            available = new Map();
        for(let lyr_name of target_layer)
            available.set(lyr_name, [i18next.t("app_page.common.target_layer"), user_data[lyr_name]]);
        if(ext_dataset)
            available.set(dataset_name, [i18next.t("app_page.common.ext_dataset"), joined_dataset[0]]);
        for(let lyr_name of result_layers)
            available.set(lyr_name, [i18next.t("app_page.common.result_layer"), result_data[lyr_name]]);
        return available;
    },
    create: function(layer_name){
        this.columns_headers = [];
        this.nb_features = undefined;
        this.columns_names = undefined;
        this.tables = this.get_available_tables()
        let modal_box = make_dialog_container("browse_data_box", i18next.t("app_page.explore_box.title"), "discretiz_charts_dialog");
        let container = document.getElementById("browse_data_box");
        this.box_table = d3.select(container).select(".modal-body");
        this.top_buttons = this.box_table.append('p')
            .styles({"margin-left": "15px", "display": "inline", "font-size": "12px"});

        let fn_cb = (evt) => { helper_esc_key_twbs_cb(evt, _onclose); },
            _onclose = () => {
                modal_box.close();
                container.remove();
                overlay_under_modal.hide();
                document.removeEventListener('keydown', fn_cb);
            };
        container.querySelector(".btn_cancel").onclick = _onclose;
        container.querySelector("#xclose").onclick = _onclose;
        container.querySelector(".btn_ok").onclick = _onclose;
        document.addEventListener('keydown', fn_cb);
        overlay_under_modal.display();
        this.display_table(layer_name);
    }
};
