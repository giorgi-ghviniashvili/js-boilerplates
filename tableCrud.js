function format() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];
    
    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }
    
    return theString;
}

function CrudApp(params) {

    var attrs = {
        id: "table-" + Math.floor(Math.random() * 1000000),
        classList: null,
        customTableHeader: null,
        container: 'body',
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
            ths += '<th>' + headerName + '</th>';
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
                    row += "<td id='" + propt + i + "'>" + obj[propt] + "</td>";
                }

                row += "</tr>";
                tableRowsString += row;
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

    main.update = fetchAll;

    main.cancel = fetchAll;

    main.data = function (value) {
        if (!arguments.length) return attrs.data;
        attrs.data = value;
        return main;
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
            else {
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

    return main;
}