function CrudApp(params) {

    var attrs = {
        id: "table-" + Math.floor(Math.random() * 1000000),
        classList: null,
        customTableHeader: null,
        container: 'body',
        fieldTypes: null,
        notIncludeColumns: [],
        table: null,
        add: null,
        update: null,
        delete: null,
        data: null
    };

    var createTable = function () {
        // if user does not pass custom headerRowValues, use keys
        var headerNames = attrs.customTableHeader == null ? Object.keys(attrs.data[0]) : attrs.customTableHeader;

        var table = format("<table class='{0}' id='{1}'>",attrs.classList == null ? '' : attrs.classList["table"], attrs.id) + "{0}{1}</tbody>";

        var thead = format("<thead class='{0}'>", attrs.classList == null ? '' : attrs.classList["thead"]) + "{0}</thead>";

        var tbody = format("<tbody class='{0}'>", attrs.classList == null ? '' : attrs.classList["tbody"]) + "</tbody>";

        var theadRow = "<tr>{0}</tr>";

        var ths = '';

        headerNames.forEach(headerName => {
            if (validColumnName(headerName)){
                ths += '<th>' + headerName + '</th>';
            }
        });

        theadRow = format(theadRow, ths);

        thead = format(thead, theadRow);

        table = format(table, thead, tbody);

        var tableContainer = document.createElement('div');
        tableContainer.setAttribute('class', 'table-container');
        tableContainer.innerHTML = table;
        return tableContainer;
    };

    var fetchAll = function () {
        var tableRowsString = '';

        if (attrs.data.length > 0) {
            for (var i = 0; i < attrs.data.length; i++) {
                var obj = attrs.data[i];
                var row = format("<tr data-index='{0}'>", i);

                for (var propt in obj) {
                    if (validColumnName(propt)){
                        var value = obj[propt] == null ? '' : obj[propt];
                        row += "<td data-columnname = '" + propt + "' id='" + propt + i + "'>" + value + "</td>";
                    }
                }

                row += "</tr>";
                tableRowsString += row;
                delete attrs.data[i].state;
            }
        }

        attrs.table.querySelector('tbody').innerHTML = tableRowsString;
    };

    var main = function () {
        
    };

    //Dynamic keys functions
    Object.keys(attrs).forEach(key => {
      // Attach variables to main function
      return main[key] = function (_) {
        var string = `attrs['${key}'] = _`;
        if (!arguments.length) { return eval(` attrs['${key}'];`); }
        eval(string);
        return main;
      };
    });

    main.attrs = attrs;

    main.update = function(data) {
        data.forEach(x => {
            attrs.data.forEach((m, i) => {
                if (x.Id == m.Id){
                    attrs.data[i] = x;
                }
            });
        });
        fetchAll();
    };

    main.cancel = fetchAll;

    main.data = function (value) {
        if (!arguments.length) return attrs.data;
        attrs.data = value;
        return main;
    };
    
    main.inlineEditRow = function () {
        
        var rows = attrs.table.getElementsByTagName('tr');
        for (var i = 0; i < rows.length; i++) {
            var tds = rows[i].getElementsByTagName('td');
            var entityIndex = +rows[i].getAttribute("data-index"); // get item's index
            for (var j = 0; j < tds.length; j++) {
                var columnName = tds[j].getAttribute('data-columnname');
                var text = tds[j].innerText;
                var id = tds[j].getAttribute("id");
                var filedType = attrs.fieldTypes[j];
                if (filedType != null){
                    var childElement = getChildElement(filedType, text, columnName);

                    childElement.setAttribute("data-index", entityIndex);
                    childElement.setAttribute("data-columnname", columnName);

                    tds[j].innerHTML = "";
                    tds[j].appendChild(childElement);

                    if (filedType.init) {
                        filedType.init("#" + id + " .update-control");
                    }
                }
            }
        }

        // add change event listener
        document.addEventListener('change',function(e){
            if(e.target && e.target.classList.contains('update-control')){
                var entityIndex = e.target.getAttribute("data-index");
                var columnName = e.target.getAttribute("data-columnname");
                var notIncludedColumnName = attrs.notIncludeColumns.filter(x => x.refValue == columnName);

                if (notIncludedColumnName.length == 0 || e.target.tagName == 'SELECT'){
                    var chosen = event.target.value;
                    if (notIncludedColumnName.length > 0) {
                        attrs.data[entityIndex][notIncludedColumnName[0].value] = chosen;
                        attrs.data[entityIndex].state = "modified";
                    }
                    attrs.data[entityIndex][columnName] = chosen;
                    attrs.data[entityIndex].state = "modified";
                }
                else {
                    if (event.target.hasAttribute("data-id")){
                        var chosen = event.target.getAttribute("data-id");
                        
                        if (notIncludedColumnName.length > 0){
                            attrs.data[entityIndex][notIncludedColumnName[0].value] = chosen;
                            attrs.data[entityIndex].state = "modified";
                        }
                    }
                }
            }
        })
    };

    main.save = function () {
        var addedData = [];
        var newRows = attrs.table.getElementsByClassName('newRows');

        for (var i = 0; i < newRows.length; i++) {
            var _data = {};
            var inputs = newRows[i].getElementsByTagName("input");
            for (var j = 0; j < inputs.length; j++) {
                var input = inputs[j];
                var key = input.getAttribute("data-key");
                _data[key] = input.value;
            }
            addedData.push(_data);
            attrs.data.push(_data);
        }

        return addedData;
    };

    main.saveEdited = function () {
        var modifiedDataArray = attrs.data.filter(x => x.state === "modified");
        modifiedDataArray.forEach(x => {
            delete x.state;
        });
        return modifiedDataArray;
    };

    main.addRow = function () {
        var row = document.createElement("tr");
        row.setAttribute("class", "newRows");
        // append row to table
        Object.keys(attrs.data[0]).forEach(function (key) {
            
            var td = document.createElement("td");
            td.setAttribute("id", key + attrs.data.length);
            if (key.toLowerCase() != "id") {
                var input = document.createElement("input");
                input.setAttribute("type", "text");
                input.setAttribute("class", "form-control");
                input.setAttribute("data-key", key);
                td.appendChild(input);
            }
            else{
                td.innerHTML = "-";
            }
                
            row.appendChild(td);
            
        });
        var tbody = attrs.table.querySelector('tbody');
        tbody.insertBefore(row, tbody.firstChild);
    };

    var deleteRows = [];

    // returns selected rows that we want to delete
    main.delete = function () {
        deleteRows.forEach(x => {
            var index = attrs.data.indexOf(x);
            attrs.data.splice(index, 1);
        });
        return deleteRows;
    }

    main.addDeleteCheckboxes = function () {
        var checkboxes = attrs.table.querySelectorAll("input[type='checkbox']");
        if (checkboxes.length == 0) {
            var rows = attrs.table.querySelectorAll("tbody tr");
            for (var i = 0; i < rows.length; i++) {
                var td = document.createElement("td");
                var input = document.createElement("input");
                input.setAttribute("type", "checkbox");
                input.setAttribute("class", "deleteSelection");
                td.appendChild(input);
                rows[i].insertBefore(td, rows[i].firstChild);
            }
        }

        // add select functionality to the newly added checkboxes
        document.addEventListener('click', function (e) {
            if (e.target && e.target.classList.contains('deleteSelection')) {
                var dataIndex = e.target.closest('tr').getAttribute("data-index");
                var dataEntry = attrs.data[+dataIndex];
                if (e.target.checked) {
                    deleteRows.push(dataEntry);
                }
                else {
                    var indexOfEntry = deleteRows.indexOf(dataEntry);
                    deleteRows.splice(indexOfEntry, 1);
                }
            }
        })
    };

    main.run = function () {
        var container = document.querySelector(attrs.container);
        var tableContainer = createTable();
        container.appendChild(tableContainer);
        attrs.table = container.querySelector('table');
        fetchAll();
        return main;
    };

    // ############### private functions ##############
    var getChildElement = function (obj, value) {
         var el = document.createElement(obj.element);
         el.setAttribute("class", "form-control update-control");
         if (Array.isArray(obj.dropDown)) {
            obj.dropDown.forEach(d => {
                var option = document.createElement("option");
                option.innerText = d.text;
                option.setAttribute("value", d.value);
                el.appendChild(option);
            });
         }

         Object.keys(obj).forEach(key => {
            if (key === 'element' || key === 'dropDown') {
                
            }
            else{
                if (key === 'value') {
                    el.setAttribute(key, value);
                }
                else {
                    el.setAttribute(key, obj[key]);
                }
            }
         });
         return el;
    };

    var validColumnName = function(columnName) {
        var filtered = attrs.notIncludeColumns.filter(x => x.value == columnName);
        if (filtered.length > 0){
            return false;
        }
        return true;
    }

    return main;
}