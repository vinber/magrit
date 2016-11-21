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
        ["/", function(a, b){ return a / b; }],
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
            return request_data("POST", "/helpers/calc", formToSend).then(function(e){
                let data = JSON.parse(e.target.responseText);
                for(let i=0; i<table.length; i++)
                    table[i][new_name_field] = data[i];

                return true;
            });
        }
        else if(options.type_operation === "math_compute"){
            let math_func = get_fun_operator(operation)
            if(fi2 != "user_const_value"){
                for(let i=0; i<table.length; i++){
                    if(table[i][fi1] != null && table[i][fi2] != null){
                        table[i][new_name_field] = math_func(+table[i][fi1], +table[i][fi2]);
                    } else {
                        table[i][new_name_field] = null;
                    }
                }
            } else {
                opt_val = +opt_val;
                for(let i=0; i<table.length; i++){
                    if(table[i][fi1] != null){
                        table[i][new_name_field] = math_func(+table[i][fi1], opt_val);
                    } else {
                        table[i][new_name_field] = null;
                    }
                }
            }
            return Promise.resolve(true);
        } else {
            if(operation == "truncate"){
                for(let i=0; i < table.length; i++)
                    table[i][new_name_field] = table[i][fi1].substring(0, +opt_val);

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
                        if(window.fields_handler && current_layers[layer_name].targeted){
                            fields_handler.unfill();
                            fields_handler.fill(layer_name);
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

    var new_name = div1.append("p").html(i18next.t("app_page.explore_box.add_field_box.new_name"))
                            .insert("input").attr('value', 'NewFieldName')
                            .on("keyup", check_name);
    var type_content = div1.append("p").html(i18next.t("app_page.explore_box.add_field_box.new_content"))
                            .insert("select").attr("id", "type_content_select")
                            .on("change", function(){
                                chooses_handler.type_operation = this.value;
                                refresh_type_content(this.value); });

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
