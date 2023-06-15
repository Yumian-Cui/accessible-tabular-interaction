
// ==================== initializations ====================
class FocusedCell {
  constructor(rowName, colName, contents, isHeader) {
    this.rowName = rowName;
    this.colName = colName;
    this.contents = contents;
    this.isHeader = isHeader; // is the cell a header cell?
  }
}

keys = []; //stores bools for each keyCode - true if the key is down, false if it's up
traceKeys = []; // contain the {left, up, right} key codes visited, 37, 38, 39
focusStack = [];
tempfocusStack = [];
lastVisitedKey = false;
recPress = 0;
tabPress = 0;
addFocus = true;
onColHeader = true;
addDropdown = false;
var header; // the current focused header
var rec = false;
const headerCells = document.getElementsByClassName("ag-header-cell");
var sum = document.getElementById('summary');
//TODO CHANGE THIS
var defaultHeader = ["College"]; // an array initialized with the first col name
var current_cell = new FocusedCell("Abilene Christian University", "College", "Abilene Christian University");
var tableSummary = tbDes + " To enter the table, press tab key. Navigate the table with the arrow keys and press the question mark (or forward slash) key for recommendations about next steps.";
filteredColumns = [];

/** 
* table settings for ag-grid
*/
const gridOptions = {

  // each entry here represents one column
  columnDefs: columndefs,
  // default col def properties get applied to all columns
  defaultColDef: {
    sortable: true,
    filter: true,
  },

  // define specific column types
  columnTypes: {
    categorical: { filter: 'agTextColumnFilter' },
    numerical: { filter: 'agNumberColumnFilter' },
  },

  navigateToNextHeader: navigateToNextHeader,
  
  onCellFocused(e) {
    if (onColHeader) {
      console.log("leaving header");
    }
    onColHeader = false;
    if (addFocus) {
      focusedCell = gridOptions.api.getFocusedCell();
      row = gridOptions.api.getDisplayedRowAtIndex(focusedCell.rowIndex);
      cellValue = gridOptions.api.getValue(focusedCell.column, row);
      var col = getColumn();
      var colName = col.getId();
      console.log('onCellFocused: (' + row.id + ',' + colName + "," + cellValue + ')');
      focusStack.push(current_cell);
      current_cell = new FocusedCell(row.id, colName, cellValue, false);
      if (tempfocusStack) tempfocusStack.pop();
      tempfocusStack.push(col);
    } else {
      addFocus = true;
    }
  },

  getRowId: (params) => params.data.id, //TODO: needs fixing, now won't change dynamically

  rowSelection: 'multiple', // allow rows to be selected
  animateRows: false, // have rows animate to new positions when sorted
};

//returns column object of selected cell
function getColumn() {
  el = gridOptions.api.getFocusedCell();
  // if (el == null) {
  //   var col = gridOptions.columnApi.getColumn(defaultHeader);
  //   header = true;
  //   onColHeader = true;
  //   return col;
  // }
  // console.log("is el available?" + );
  // console.log("header: " + header.column.getId());
  // console.log("onColHeader: " + onColHeader);
  // console.log("keys[38]: " + keys[38]);
  // console.log("getColumn header: " + header);
  // console.log("getColumn onColHeader: " + onColHeader);
  if (header && onColHeader) { // now the system will be able to recognize if the user focused on header cell
    //  console.log("hiii");
    if (keys[38]) { //keys38-> arrow up, BUG 2 + BUG 3, new bug, when focus is already on col header, and call getColumn() will return last visited column header
      // console.log("tempfocusStack[0]: " + tempfocusStack[0].getId());
      return tempfocusStack[0];
    }

    var keyCode = traceKeys[traceKeys.length - 1];
    // console.log(keyCode);
    // console.log("getColumn header.column: " + header.column.getId());
    // console.log("getColumn tempfocusStack[0]: " + tempfocusStack[0]);
    return (keyCode == 37 || keyCode == 39) ? header.column : tempfocusStack[0]; // BUG9
  }

  return el.column;
}

// what does this function do ???
function changeCellFocus() {
  addFocus = false;
  cell = focusStack.pop();

  if (cell.isHeader) {
    console.log("focusing column " + cell.colName);
    var headerElement = document.querySelector('.ag-header-cell[col-id="' + cell.colName + '"]');
    headerElement.focus();
  }

  if (cell.rowName != null) {
    rowNode = gridOptions.api.getRowNode(cell.rowName);
    console.log("focus to " + rowNode.rowIndex + "," + cell.colName + "," + cell.contents);
    gridOptions.api.setFocusedCell(rowNode.rowIndex, cell.colName);

    if (focusStack.length == 0) { // ??? 
      //TODO CHANGE THIS 
      refreshAttributes();
      //focusStack.push(new FocusedCell("Abilene Christian University", "College", "Abilene Christian University"));
    }
  }
}

// used in gridOptions as it navigates between header cells
function navigateToNextHeader(params) {
  const nextHeader = params.nextHeaderPosition;
  console.log("This is " + nextHeader.column.getId());
  // console.log(onColHeader);
  defaultHeader.push(nextHeader.column.getId());
  // console.log(defaultHeader);
  header = nextHeader;
  // console.log(header);
  // nextHeader = nextHeader.column.getId();
  // test();
  return nextHeader;
}

//sorts selected column by asc/desc/null
function sortColumn(colName) {
  var colState = colName.getSort();
  var sortState = 'asc';
  if (colState === 'asc') { sortState = 'desc'; }
  if (colState === 'desc') { sortState = null; }
  gridOptions.columnApi.applyColumnState({
    state: [{ colId: colName.getId(), sort: sortState }],
    defaultState: { sort: null },
  });
  keys = [];
}

//Looks for custom keyboard shortcuts to run sort/filter
// http://gcctech.org/csc/javascript/javascript_keycodes.htm
onkeydown = function KeyPress(e) {
  e = e || event;
  keys[e.keyCode] = true;
  
  // left, up, right keys
  if ([37, 38, 39].includes(e.keyCode)) { // BUG9
    traceKeys.push(e.keyCode);
  }
  lastVisitedKey = e.keyCode;
  focusedCell = gridOptions.api.getFocusedCell();

  if (tabPress) {
    // console.log(gridOptions.api.getFilterModel());
    // console.log(onColHeader);
    // if (onColHeader) {
    //   if (!keys[88]) { // NOT key x
    //     var focusedHeader = new FocusedCell(null, defaultHeader.slice(-1), null, true);
    //     var prevCell = focusStack.pop();

    //     if (focusedHeader == prevCell) {
    //       focusStack.push(prevCell);
    //     } else {
    //       console.log("visited header " + defaultHeader.slice(-1));
    //       console.log("prevCell:", prevCell);
    //       focusStack.push(prevCell);
    //       focusStack.push(focusedHeader);
    //       console.log("focusStack:", focusStack);
    //     }
    //   }
    // }
    // else {
    //   console.log("on cell, row " + focusedCell.rowIndex);
    // }

    // check for focus
    //if (headerCells.contains(document.activeElement)) {
    //  console.log("header focused");
    //}

    //  for (let i = 0; i < headerCells.length; i++) {
    //    if (headerCells[i] = document.activeElement && !document.activeElement.classList.contains("ag-cell")) {
    //       console.log("in header " + i);
    //   }
    // }
    focusedCell = gridOptions.api.getFocusedCell();

    // console.log("document.activeElement.id", document.activeElement.id);
    // 38 -> arrow up
    if (keys[38] && focusedCell && focusedCell.rowIndex == 0) {
      // rec = false;
      console.log("moving to header");
      onColHeader = true;
    }
    //ctrl+alt+s -> sort function
    if (keys[83]) {
      rec = false;
      //alert("sort");
      col = getColumn();
      // keys = [];
      sortColumn(col);
    }
    //ctrl+alt+f -> filter function
    //if (keys[70] && keys[17] && keys[18]) {
    if (keys[70]) {
      rec = false;
      setFilterInputQuery(); //https://docs.google.com/document/d/1CV_vjZPCS9wFuYEabKstFX_SrfbneTc5TqK11S1gMh0/edit
      // updateFilterByQuery(query);
      //resets keys - onkeyup doesn't register w popups

      //TODO: filter col by query
      keys = [];
    }
    
    //ctrl+alt+z -> reset filters
    if (keys[90]) {
      rec = false;
      resetFilters();
      keys = [];
    }
    
    //ctrl+alt+x -> WHAT does this do? TODO
    if (keys[88]) {
      addDropdown = false;
      document.activeElement?.blur();

      changeCellFocus();
      keys = [];
    }
    
    //"?" or forward slash -> recommendation
    if (keys[191]) {
      rec = true; // rec prepended to p tag
      recPress = recPress + 1;
      // printRecommendations();
      keys = [];
    }
    
    // u: to unlock and show the default per-column summary
    if (keys[85]) {
      rec = false;
      removeStyle();
      locked = [];
      keys = [];
    }

    // lock key l?
    if (keys[76]) {
      rec = false;
      lock(e);
      keys = [];
    }

    // compare magic key, M/m, once pressed, begin comparison mode with the locked column
    if (keys[77]) {
      rec = false;
      magic(e);
      magicCount = 1;
      keys = [];
    }

    if (!magicCount) { // if the user moves away from the last magic column, the blue format will disappear
      removeStyle(locked[1]); 
      locked.splice(1,1);
    }

  }


  // tab key
  if (keys[9]) {
    tabPress = tabPress + 1;
    keys = [];
  }
}

// ==================== Recommendations ====================
const init_rec = "Press tab to enter the table. Navigate left and right through column headers to see summary for each column.<br>"; // initial recommendation will be invoked pressing ANY NON-TAB key
const header_rec = "Try: <br>1. Filter current column by pressing F.<br>2. Sort current column by pressing S.<br>3. Lock current column by pressing L.<br>";
const header_key_rec = "Try: <br>1. Filter current column by pressing F.<br>2. Sort current column by pressing S.<br>";
const keyheader_rec = "Try: <br>1. Filter current column by pressing F.<br>2. Sort current column by pressing S.<br>";
const data_rec_cat = "To filter by the current cell value, press F.<br>";
const data_rec_num = "To filter by the current cell value, press F. If there are no matching values in this column, the system will filter by similar values in the same quantile as the selected value.<br>";
var visitedCellVals = [];

function printRecommendations(e) {
  console.log("Recommendations active");
  var recText = "";
  // TODO:
  // if page just loaded
  // console.log("focusStack.length: " + focusStack.length);
  // console.log("defaultHeader.length: " + defaultHeader.length);
  // console.log("tabPress: " + tabPress);
  if (focusStack.length == 0 && defaultHeader.length == 1) {
    if (tabPress) { // if already press tab once
      recText += keyheader_rec;
      // rec = false; // BUG 1 
    } else {
      recText += init_rec;
    }
    rec = false; // BUG 1 
  } else {
    // if locked status
    if (onColHeader) {
      // console.log("You've locked: :" + locked);
      // console.log("TEST :" + getColumn().getId()); // THIS ONE NEEDS TO BE FIXED
      if (locked.includes(getColumn().getId()) && locked.length == 1) {
        // recText += "Try: <br>1. Try moving to lock another column (except key column) by pressing L and see what happens.<br>2. Filter current column by pressing F.<br>3. Sort current column by pressing S.<br>";// DEV, still need to be improved
        recText += header_key_rec; // 6/14/23 YMC DO NOT try to persuade the user move to another column to do something because we'd like avoiding multi-step
        rec = false;
      }
      if (!locked.includes(getColumn().getId()) && locked.length == 1) {
        // recText += `You locked Column ${locked[0]}. Try locking the current or another column by pressing L and see what happens. <br>`; // DEV, still need to be improved
        recText += (headers[getColumn().getId()].key)? header_key_rec:`Try: <br>1. ${getLockedRec(locked[0], getColumn().getId())}<br>2. Filter current column by pressing F.<br>3. Sort current column by pressing S.<br>`; // DEV, still need to be improved
        rec = false;
      }
      if (locked.includes(getColumn().getId()) && locked.length == 2) {
        // recText += "No further recommendations at this point. Unlock both columns by pressing U.<br>"; // DEV, still need to be improved
        recText += header_key_rec;
        rec = false;
      }
      if (!locked.includes(getColumn().getId()) && locked.length == 2) {
        recText += (headers[getColumn().getId()].key)? header_key_rec:`Try: <br>1. ${getLockedRec(locked[0], getColumn().getId())}<br>2. Filter current column by pressing F.<br>3. Sort current column by pressing S.<br>`; // DEV, still need to be improved
        rec = false;
      }
    } else {
      recText += (headers[getColumn().getId()].dataType == "number") ? data_rec_num : data_rec_cat;
      rec = false;
      // return;
    }
    // if unlocked status
    // if focused on header cell, do ...
    if (locked.length == 0) {
      if (onColHeader) {
        recText += (headers[getColumn().getId()].key) ? header_key_rec : header_rec;
      } else {
        if (!(recText.includes(data_rec_num)) && !(recText.includes(data_rec_cat))) {
          recText += (headers[getColumn().getId()].dataType == "number") ? data_rec_num : data_rec_cat;
        }
      }
      rec = false;
    }

    // if focused on data cell, do ...    
  }
  // rec = false;
  return recText;
}

/**
 * Given two columns, get a recommendation given their types
 * @param {String} lockedCol 
 * @param {String} currCol 
 */
function getLockedRec(lockedCol, currCol) {
  var lockedNum = headers[lockedCol].dataType == "number";
  var currNum = headers[currCol].dataType == "number";
  var bothNums = `You've locked numerical column ${lockedCol}, Press M if you want to see the correlation between ${lockedCol} and ${currCol}.`;
  var NumCat = `You've locked numerical column ${lockedCol}, Press M if you want to get a pivot table between ${lockedCol} and ${currCol}.`;
  var bothCats = '';
  var CatNum = `You've locked categorical column ${lockedCol}, Press M if you want to get a pivot table between ${lockedCol} and ${currCol}.`;
  return lockedNum? (currNum? bothNums:NumCat):(currNum? CatNum:bothCats);
}

var defaultDatasetUrl = './assets/data/colleges.json';
function getDatasetUrlFromQueryString() {
  var urlParams = new URLSearchParams(window.location.search);
  return !urlParams.get('dataset')? false:'./assets/data/' + urlParams.get('dataset');
}

var datasetUrl = getDatasetUrlFromQueryString() || defaultDatasetUrl;

function refreshAttributes() {
  if (datasetUrl.includes('colleges.json')) {
    // columndefs = colleges_columnDefs;
    gridOptions.columnDefs = colleges_columnDefs;
    headers = college_headers;

  } else if (datasetUrl.includes('housing.json')) {
    gridOptions.columnDefs = housing_columnDefs;
    headers = housing_headers;
    defaultHeader = ["ID"];
    tbDes = "This table contains data about housing in the US.";
    var current_cell = new FocusedCell("1", "ID", "1");
  } else if (datasetUrl.includes('sales.json')) {
    gridOptions.columnDefs = sales_columnDefs;
    headers = sales_headers;
    defaultHeader = ["ID"];
    var current_cell = new FocusedCell("1", "ID", "1");
    tbDes = "This table contains data about coffee sales in the US.";
  } else {
    console.log("dataset not available.");
  }
  document.getElementById('summary').innerHTML = tbDes + " To enter the table, press tab key. Navigate the table with the arrow keys and press the question mark (or forward slash) key for recommendations about next steps.";
}



// function refreshHeaders() {
//   if (datasetUrl == )
// }

//loads table: TODO add more datasets
document.addEventListener('DOMContentLoaded', function() {
  const gridDiv = document.querySelector('#mainTable');
  refreshAttributes();
  console.log(datasetUrl);
  // setDatasetDefaults(datasetUrl);
  console.log(gridOptions);
  new agGrid.Grid(gridDiv, gridOptions);
  fetch(datasetUrl)
    .then((response) => response.json())
    .then((data) => gridOptions.api.setRowData(data));
});



//===============Functions for retrieving table data===============

// https://stackoverflow.com/questions/50697232/how-can-i-get-all-the-rows-of-ag-grid
// https://stackoverflow.com/questions/55103711/how-to-create-an-array-using-values-from-columns-in-ag-grid
// https://github.com/ag-grid/ag-grid/issues/892
// only visible rows will be counted
// an optional argument filterBy
// the second optional argument, col
function getAllRows(col, filterBy) {
  let rowData = [];
  var model = gridOptions.api.getModel();
  // console.log(model.getRowCount());
  var rowCount = model.getRowCount();
  for (var i = 0; i < rowCount; i++) {
    // console.log(model.getRow(i).data["Type"]);
    var row = model.getRow(i).data;
    if (col && filterBy) {
      // console.log("pass");
      if (row[col] == filterBy) rowData.push(model.getRow(i).data);
      continue;
    } else {
      rowData.push(model.getRow(i).data);
    }
  }
  return rowData;
}

// let rows; // an array of rows for the dataset, populated if null

// get an array for any column given column name/id
// rows default is getAllRows()
function getColArray(colName, rows) {
  // optimize this later, should check if a filter is on or not
  // if (rows == null || (getAllRows() != rows)) { rows = getAllRows(); }
  rows = rows ? rows : getAllRows();
  // console.log(rows.map(row => row[colName]));
  return rows.map(row => row[colName]);
}

//=============== Functions for lock/unlock LOCK UNLOCK ===============

function setColumnStyle(columnId, color, border) {
  var column = gridOptions.columnApi.getColumn(columnId);
  var headerElement = document.querySelector('.ag-header-cell[col-id="' + columnId + '"]');
  // column.setPinned('left');

  headerElement.style.backgroundColor = color;
  headerElement.style.border = border; // '2px solid red'
}

function removeStyle(column) {
  // locked.forEach(function(column) {
  //   setColumnStyle(column, '', '');
  // });
  setColumnStyle(column, '', '');
}

function checkLocked(colName) {
  return locked[0] == colName;
}

/**
 * Check if a column is an "active" column being compared
 * @param {String} colName 
 * @returns 
 */
function checkActive(colName) {
  return locked.includes(colName);
}

var locked = []; // only allow at most two cols be stored at a time, if more is added, the original two will be deleted automatically // 6/14/23 YMC allow only one lock at a time
// function to lock and also control the lock mode
// var lockMode = false;

function getColName() {
  try {
    var colName = getColumn().getId();
  } catch (error) {
    var colName = defaultHeader[0];
  }
  return colName;
}
function lock(e) {
  var colName = getColName();
  console.log(getColumn().getId());
  console.log(defaultHeader[0]);
  console.log("Try to lock: " + colName);
  var sum = document.getElementById('summary');
  if (headers[colName].key) {
    sum.innerHTML = `Key Column ${colName} can't be locked.`;
    return;
  }
  if (locked.length == 0) {
    locked.push(colName);
    setColumnStyle(colName, 'yellow', '2px solid red');
    // headers[colName].lock = 1;
    sum.innerHTML = `Column ${colName} locked.`;
  // } else if (locked.length == 1) {
  //   if (locked[0] != colName) { // to avoid press l twice (unintential user mistake)
  //     locked.push(colName);
  //     setColumnStyle(colName, 'yellow', '2px solid red');
  //     sum.innerHTML = `Column ${locked[0]} and Column ${colName} locked.`; // now both columns locked  
  //     // locked = []; // auto-unlock
  //   } else {
  //     sum.innerHTML = `Column ${colName} already locked.`;
  //   }
  } else { // if there're already 2 cols in locked // 6/14/23 YMC if there's already one column locked
    // console.log(locked);
    if (locked[0] != colName) {
      sum.innerHTML = `Column ${locked[0]} auto unlocked.`;
      removeStyle(locked[0]);
      locked = []; // auto-unlock
      lock(e);
      // keys[e.keyCode] = false;
    } else {
      sum.innerHTML = `Column ${locked[0]} already locked.`;
    }
    // lock();
  }
  // return sum.innerHTML;
  // keys[e.keyCode] = false;
}

function magic(e) {
  var colName = getColName();
  var sum = document.getElementById('summary');
  if (locked.length == 1) {
    locked.push(colName);
    setColumnStyle(colName, 'cyan', '2px solid red');
  } else if (locked.length == 2) {
    if (locked[1] != colName) {
      sum.innerHTML = `Column ${locked[1]} auto removed from compare mode.`;
      removeStyle(locked[1]);
      locked.splice(1, 1); // pop out the compare element
      magic(e);
    } else {
      sum.innerHTML = `Column ${locked[1]} already in compare mode.`;
    }
  }
}

//=============== Functions for updating content in <p> tag ===============

var tryLockKey;
// var lastPTag;

// Function for updating per-col summary
// this function's logic needs optimization, now I have bunch of ifs here, not good programming practice lol
onkeyup = function updatePTag(e) {
  var sum = document.getElementById('summary');

  // before press tag key, press any other key will invoke init_rec TODO this is a temporary hotfix
  if (tabPress == 0) {
    sum.innerHTML = init_rec;
    return;
  }
  if (sum.innerHTML.includes("can't be locked") && lastVisitedKey == 76) {
    tryLockKey = true;
    // lastPTag = sum.innerHTML;
  }
  // console.log(keys);
  // if (lastVisitedKey == 76) {
  //   sum.innerHTML = lock(e);
  //   return;
  // }

  if (!sum.innerHTML.includes(init_rec) || focusStack.length != 0) { // if initial rec has not been invoked OR focusStack is not empty
    if (focusStack.length != 0) {
      // console.log("been here: " + getColumn().getId());
      sum.innerHTML = getPerColSummary(getColumn().getId());
      // console.log("shouldn't be here")
    } else { // BUG 4
      if (defaultHeader.length != 1 || defaultHeader[0] == "College") { // BUG 4, hardcoding, change later BUG 8
        sum.innerHTML = getPerColSummary(defaultHeader[defaultHeader.length - 1]);
        if (recPress == 1 & !tabPress) { // originally it's recPress == 1 & !tabPress
          sum.innerHTML = tableSummary;
        }
      }
    }
    if (locked.length == 2 && (checkActive(getColumn().getId()) && onColHeader && magicCount)) { // meaning it's in lock (and compare mode) mode and users need to focus on locked column headers
      sum.innerHTML = getBetweenColsSummary(locked[0], locked[1]);
      magicCount = 0;
    }
    if (addDropdown) {
      sum.innerHTML = "No matching values found. ";
      sum.innerHTML += createDropdownMenu();
      sum.innerHTML += " Press space to select a filter category. Press X to return to the table.";
      document.getElementById("filterValues").focus();
    }
    // if (gridOptions.api.getFilterModel() != null) {
    //   sum.innerHTML += "Data is filtered. Press Z to clear filters.";
    //  }
    // console.log("rec: " + rec);
    if (rec) {
      //sum.insertAdjacentHTML('beforebegin', printRecommendations(e));
      // sum.innerHTML = printRecommendations(e) + sum.innerHTML;
      sum.innerHTML = printRecommendations(e);
      //rec = false; // so that rec won't be prepended once user does the next action
    }

    if (start && end && filterCol) {
      //sum.innerHTML = `The table has been filtered by ${filterCol} to show values within the range of ${start} and ${end}. Feel free to explore the table. To undo the filter, press z.`;
      sum.innerHTML = `Filtering on ${filterCol} in the range of ${start} and ${end}. Feel free to explore the table. To undo the filter, press z.`;
      start = null;
      end = null;
      filterCol = null;
    }
    else if (queryText && filterCol) {
      sum.innerHTML = `Filtering on ${filterCol} to show ${queryText}. Feel free to explore the table. To undo the filter, press z.`;
      queryText = null;
      filterCol = null;
    }
  } else {
    // console.log("HERE");
  
    sum.innerHTML = tabPress? getPerColSummary(defaultHeader[defaultHeader.length - 1]):rec? init_rec:tableSummary;
    // return; // return early
  }

  updateFilterPrintout();
  keys[e.keyCode] = false;
  tryLockKey = false;
}

// ==================== update column summary ====================

function getPerColSummary(colName) {
  // if (!colName) {
  //   if (header) {
  //     colName = defaultHeader.slice(-1);
  //   } else {
  //     var col = getColumn();
  //     var colName = col.getId();
  //   }
  // }
  var colType = headers[colName].dataType;
  var cellSummary = (onColHeader || headers[colName].key) ? "" : `${current_cell.rowName} has ${current_cell.colName} of ${current_cell.contents}.<br>`;
  var suggestion = "";
  if (locked.length == 1 && !headers[colName].key) {
    suggestion = " " + getLockedRec(locked[0], colName);
  }

  if (colType == "text") {
    return cellSummary + updateTextSummary(colName) + suggestion;
  } else if (colType == "number") {
    return cellSummary + updateNumberSummary(colName) + suggestion;
  } else { // any other types not implemented
    return cellSummary + "data type not implemented yet";
  }
}

function getBetweenColsSummary(col1, col2) {
  if ((headers[col1].dataType == "text" && headers[col2].dataType == "number") || (headers[col1].dataType == "number" && headers[col2].dataType == "text")) {
    return getCatNumColsSummary(col1, col2);
  } else if (headers[col1].dataType == "number" && headers[col2].dataType == "number") {
    return getNumNumColsSummary(col1, col2);
  } else {
    return "Between column summaries not implemented yet";
  }
}

function getCatNumColsSummary(col1, col2) {
  console.log("num+cat summary");
  // return "<table><tr><th>Type</th><th>Min</th><th>Max</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>0</td><td>0</td></tr></table>";
  var catCol;
  var numCol;
  if (isCategorical(col1)) {
    catCol = col1;
    numCol = col2;
  } else {
    catCol = col2;
    numCol = col1;
  }
  if (catCol === "College") {
    return "Cannot create pivot table with this column. Press U to unlock and try different columns.";
  }
  // getCatCountMap(colArray)
  // getCatNums(countMap) 
  // var filterRows = getAllRows(catCol, filterBy);
  // getColArray(colName, rows)
  var catColNotFiltered = getColArray(catCol); // first get the catgoeircal column non-filtered
  var countMap = getCatCountMap(catColNotFiltered); // get the dict map cat type to their tot nums
  var catColKeys = Object.keys(countMap); // array of categories
  // var n = getCatNums(countMap); // total number of categories
  var htmlTB = tbStart() + createTBRow([catCol, "Average of " + numCol, "Range of " + numCol]);

  for (let i = 0; i < catColKeys.length; i++) {
    var cat = catColKeys[i];
    var filterRows = getAllRows(catCol, cat);
    var numColFiltered = getColArray(numCol, filterRows);
    // console.log("This is " + cat);
    // console.log(filterRows);
    var avg = average(numColFiltered); // assume only avg now
    var min = Math.min(...numColFiltered);
    var max = Math.max(...numColFiltered);
    htmlTB = htmlTB + createTBRow([cat, avg.toFixed(2), min + "-" + max]);
  }


  return `Column ${col1} and Column ${col2} are locked.<br>` + `Below is a pivot table about the average and the range of ${numCol} by ${catCol}.<br>` + htmlTB + tbEnd();
}

// cite: https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
const average = array => array.reduce((a, b) => a + b) / array.length;
const total = array => array.reduce((a, b) => a + b);
function isCategorical(col) {
  return headers[col].dataType == "text";
}
function isNumerical(col) {
  return headers[col].dataType == "number";
}

// col1, col2 -> column names
function getNumNumColsSummary(col1, col2) {
  let col1Array = getColArray(col1);
  let col2Array = getColArray(col2);
  let n = col1Array.length;

  var r = correlationCoefficient(col1Array, col2Array, n); // -1 ~ 1
  // https://statisticsbyjim.com/basics/correlations/
  var analysis;
  if (r >= -1 && r <= -0.75) {
    analysis = `${col1} and ${col2} are strongly inversely correlated. That is as values for ${col1} increase, values for ${col2} tend to decrease.`;
  } else if (r <= 1 && r >= 0.75) {
    analysis = `${col1} and ${col2} are strongly positively correlated. That is as values for ${col1} increase, values for ${col2} also tend to increase.`;
  } else if (r > -0.75 && r <= -0.5) {
    analysis = `${col1} and ${col2} are moderately inversely correlated. That is as values for ${col1} increase, values for ${col2} tend to decrease, but with more variations.`;
  } else if (r < 0.75 && r >= 0.5) {
    analysis = `${col1} and ${col2} are moderately positively correlated. That is as values for ${col1} increase, values for ${col2} also tend to increase, but with more variations.`;
  } else {
    analysis = `There does not appear to be a correlation between ${col1} and ${col2}.`;
  }
  // 
  return `Column ${col1} and Column ${col2} are locked.<br>` + analysis;
}



// Javascript program to find correlation coefficient

// Function that returns correlation coefficient.
// cite: https://www.geeksforgeeks.org/program-find-correlation-coefficient/
function correlationCoefficient(X, Y, n) {

  let sum_X = 0, sum_Y = 0, sum_XY = 0;
  let squareSum_X = 0, squareSum_Y = 0;

  for (let i = 0; i < n; i++) {

    // Sum of elements of array X.
    sum_X = sum_X + X[i];

    // Sum of elements of array Y.
    sum_Y = sum_Y + Y[i];

    // Sum of X[i] * Y[i].
    sum_XY = sum_XY + X[i] * Y[i];

    // Sum of square of array elements.
    squareSum_X = squareSum_X + X[i] * X[i];
    squareSum_Y = squareSum_Y + Y[i] * Y[i];
  }

  // Use formula for calculating correlation
  // coefficient.
  let corr = (n * sum_XY - sum_X * sum_Y) /
    (Math.sqrt((n * squareSum_X -
      sum_X * sum_X) *
      (n * squareSum_Y -
        sum_Y * sum_Y)));

  return corr;
}
// get a dict, key is categorical type, value is counts
function getCatCountMap(colArray) {
  var di = colArray.reduce((acc, curr) => (acc[curr] = (acc[curr] || 0) + 1, acc), {});
  return sort_object(di);
}
// countMap arg is getCatCountMap(colArray)'s return'
function getCatNums(countMap) {
  return Object.keys(countMap).length;
}


function sort_object(obj) {
  items = Object.keys(obj).map(function(key) {
    return [key, obj[key]];
  });
  items.sort(function(first, second) {
    return second[1] - first[1];
  });
  sorted_obj = {}
  items.forEach(function(v) {
    use_key = v[0]
    use_value = v[1]
    sorted_obj[use_key] = use_value
  })
  return (sorted_obj);
}

// function to generate summary for categorical col
function updateTextSummary(colName) {
  // mode, unique number for each type, list of unique values
  if (headers[colName].summary == null) {
    var colArray = getColArray(colName);
    // https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements @ Nguyễn Văn Phong
    var uniqueCounts = getCatCountMap(colArray);
    var numCategories = getCatNums(uniqueCounts);
    // check if it's key column
    if (headers[colName].key == true) { return updateKeySummary(colName, gridOptions.api.getDisplayedRowCount()); }
    var html = newSpace(`${colName} ${checkLocked(colName) ? "(locked)" : ""} is a categorical column.`);
    html = html + newSpace(`There are ${numCategories} categories. ` + ((numCategories <= 3) ? `They are ${Object.keys(uniqueCounts).toString()}.` : `Here are three with top counts: ${Object.keys(uniqueCounts).slice(0, 3).toString()}. `));
    var ct = 0;
    for (let [category, count] of Object.entries(uniqueCounts)) {
      if (ct < 3) {
        html = html + newSpace(`${category} has a count of ${count}.`);
        ct = ct + 1;
      }
    }
  } else {
    return headers[colName].summary;
  }

  // headers[colName].summary = html;
  // return (checkLocked(colName) ? `Column ${colName} is locked.<br>` : "") + html;
  if (checkLocked(colName)) {
    html = (headers[colName].lock) ? html : `Column ${colName} is locked.`;
    headers[colName].lock = 1;
  } else {
    headers[colName].lock = 0;
  }
  return html;
}

// function to generate summary for numerical col
function updateNumberSummary(colName) {
  // min, max, avg
  // NOTE: didn't consider the case where key column is number, should we?
  var colArray = getColArray(colName);
  var min = Math.min.apply(Math, colArray);
  var max = Math.max.apply(Math, colArray);
  // cite: https://stackoverflow.com/questions/29544371/finding-the-average-of-an-array-using-js
  const average = array => array.reduce((a, b) => a + b) / array.length;
  var avg = average(colArray);
  // cite: https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
  //#Source https://bit.ly/2neWfJ2 
  const median = arr => {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };
  var med = median(colArray);

  var html = newSpace(`${colName} ${checkLocked(colName) ? "(locked)" : ""} is a numerical column.`);
  html = html + newSpace(`The minimum is ${min}.`);
  html = html + newSpace(`The maximum is ${max}.`);
  html = html + newSpace(`The average is ${avg}.`);
  html = html + newSpace(`The median is ${med}.`);

  // headers[colName].summary = html;
  // return (checkLocked(colName) ? `Column ${colName} is locked.<br>` : "") + html;
  if (checkLocked(colName)) {
    html = (headers[colName].lock) ? html : `Column ${colName} is locked.`;
    headers[colName].lock = 1;
  } else {
    headers[colName].lock = 0;
  }
  return html;
}

// function to generate summary for key col
function updateKeySummary(colName, num) {
  var html = newSpace(`${colName} is a key column.`);
  html = html + newSpace(`${colName} has a count of ${num}.`);
  // headers[colName].summary = html;
  // console.log("tryLockKey: " + tryLockKey);
  if (tryLockKey) {
    html = `Key Column ${colName} can't be locked.`;
    // tryLockKey = false;
    // console.log("tryLockKey2: " + tryLockKey);
  }
  return html;
}

// ==================== pivot table formatting ====================

function tbStart() { return "<div><table class='pivot-table'>"; }
function tbEnd() { return "</table></div>"; }

function createTBRow(elements) {
  var html = "<tr class='pivot-table'>";
  for (let i = 0; i < elements.length; i++) {
    html = html + `<th class='pivot-table'>${elements[i]}</th>`;
  }
  return html + "</tr>";
}

function newSpace(text) {
  return text + " ";
}

// ==================== Filtering ====================

//browser alert window with auto-focused input field
//returns str of user input, or a blank string
function setFilterInputQuery() {
  //let text = prompt("Filter by: ", "Public");
  if (onColHeader) {
    addDropdown = true;
    return;
  }

  focusedCell = gridOptions.api.getFocusedCell();
  row = gridOptions.api.getDisplayedRowAtIndex(focusedCell.rowIndex);
  cellValue = gridOptions.api.getValue(focusedCell.column, row);

  updateFilterByQuery(cellValue);

  //run filter
  return;
}

// @Cat
function setFilterInputQueryOld() {
  //let text = prompt("Filter by: ", "Public");
  if (onColHeader) {
    addDropdown = true;
    return;
  }

  focusedCell = gridOptions.api.getFocusedCell();
  row = gridOptions.api.getDisplayedRowAtIndex(focusedCell.rowIndex);
  cellValue = gridOptions.api.getValue(focusedCell.column, row);

  updateFilterByQuery(cellValue);

  //run filter
  return;
}

var start;
var end;
var filterCol;
var queryText;

function updateFilterByQuery(query) {
  // Get a reference to the filter instance
  const col = getColumn();
  const filterInstance = gridOptions.api.getFilterInstance(col);

  colName = col.getId();
  if (headers[colName].dataType == 'text') {
    queryText = query;
    // Set the filter model
    filterInstance.setModel({
      filterType: col.filter,
      type: 'contains',
      filter: queryText,
    });
  }

  else if (headers[colName].dataType == 'number') {
    //const [operation, num] = parseNumericalFilterQuery(query);
    var numColArray = getColArray(colName);
    var quartiles = getQuartileDict(numColArray);
    // var quartilesVals = Object.values(quartiles);
    if ((query >= quartiles[0] && query < quartiles[25])) {
      // TODO
      start = quartiles[0];
      end = quartiles[25];
    } else if ((query >= quartiles[25] && query < quartiles[50])) {
      // TODO
      start = quartiles[25];
      end = quartiles[50];
    } else if ((query >= quartiles[50] && query < quartiles[75])) {
      // TODO
      start = quartiles[50];
      end = quartiles[75];
    } else { // >= 75 and <= 100
      // TODO
      start = quartiles[75];
      end = quartiles[100];
    }
    // Set the filter model
    console.log("start end: " + start + end);
    query = parseInt(query);
    filterInstance.setModel({
      filterType: col.filter,
      type: 'inRange',
      filter: start,
      filterTo: end + 1,
      // type: 'equals',
      // filter: query,
    });
  }
  // Tell grid to run filter operation again
  gridOptions.api.onFilterChanged();
  filterCol = colName;
  if (filteredColumns.indexOf(filterCol) === -1) filteredColumns.push(filterCol);
  return;
}

function resetFilters() {
  filteredColumns = [];
  addDropdown = false;
  gridOptions.api.setFilterModel(null);
}

function updateFilterPrintout() {
  var printout = document.getElementById('filter-print');
  console.log(filteredColumns.length);
  if (filteredColumns.length === 0) {
    // if (!tabPress) return;
    printout.innerHTML = "No filters applied";
    return;
  }
  printout.innerHTML = "Filtered on: ";
  for (i = 0; i < filteredColumns.length; i++) {
    printout.innerHTML += filteredColumns[i] + ", ";
  }
}

function createDropdownMenu() {
  var col = getColumn();
  var colName = col.getId();
  var test = 5;
  var htmlDropdown = "";
  if (isCategorical(colName)) {
    var catColNotFiltered = getColArray(colName); // first get the catgoeircal column non-filtered
    var countMap = getCatCountMap(catColNotFiltered); // get the dict map cat type to their tot nums
    var catColKeys = Object.keys(countMap); // array of categories
    // var n = getCatNums(countMap); // total number of categories
    htmlDropdown = htmlDropdown + `<select name='filterValues' id='filterValues' onChange='updateCatFilter(this.value,"${colName}");'><option>All</option>`;

    for (let i = 0; i < catColKeys.length; i++) {
      var cat = catColKeys[i];
      htmlDropdown = htmlDropdown + `<option>${cat}</option>`;
    }
    htmlDropdown = htmlDropdown + `</select>`;
  }
  else {

    htmlDropdown = htmlDropdown + `<select name='filterValues' id='filterValues' onChange='updateNumFilter(this.value,"${colName}");'><option>All</option><option>0-25 percentile</option><option>25-75 percentile</option><option>75-100 percentile</option>`;
  }
  return htmlDropdown;
}

function updateCatFilter(text, col) {
  var sum = document.getElementById('summary');
  column = getColumn(col);
  resetFilter(col);
  const filterInstance = gridOptions.api.getFilterInstance(column);
  if (text === "All") {

  }
  else {
    filterInstance.setModel({
      filterType: column.filter,
      type: 'contains',
      filter: text,
    });
    gridOptions.api.onFilterChanged();
    filterCol = col;
    if (filteredColumns.indexOf(filterCol) === -1) filteredColumns.push(filterCol);
    queryText = text;
    // console.log("filtering " + text + " " + col);
  }
  sum.innerHTML = "Filtering on " + col + " by " + text + ". ";
  sum.innerHTML += createDropdownMenu();
  sum.innerHTML += " Press space to select a filter category. Press X to return to the table.";
  document.getElementById("filterValues").focus();
  return;
}

function resetFilter(colName) {
  // column = getColumn(colName);
  gridOptions.api.destroyFilter(colName);
  //const filterInstance = gridOptions.api.getFilterInstance(column);
  //filterInstance.setModel(null);
}

function updateNumFilter(text, col, quartiles) {
  var sum = document.getElementById('summary');
  resetFilter(col);
  var numColArray = getColArray(col);
  var quartiles = getQuartileDict(numColArray);

  if (text === "All") {
    return;
  }
  column = getColumn(col);
  rangeStart = 0;
  rangeEnd = 0;
  const filterInstance = gridOptions.api.getFilterInstance(column);
  if (text === "0-25 percentile") {
    rangeStart = quartiles[0];
    rangeEnd = quartiles[25];
  }
  if (text === "25-75 percentile") {
    rangeStart = quartiles[25];
    rangeEnd = quartiles[75];
  }
  if (text === "75-100 percentile") {
    rangeStart = quartiles[75];
    rangeEnd = quartiles[100];
  }

  filterInstance.setModel({
    filterType: column.filter,
    type: 'inRange',
    filter: rangeStart,
    filterTo: rangeEnd,
  });
  gridOptions.api.onFilterChanged();
  filterCol = colName;
  if (filteredColumns.indexOf(filterCol) === -1) filteredColumns.push(filterCol);
  start = rangeStart;
  end = rangeEnd;
  sum.innerHTML = "Filtering on " + col + " by " + text + ". ";
  sum.innerHTML += createDropdownMenu();
  sum.innerHTML += " Press space to select a filter category. Press X to return to the table.";
  document.getElementById("filterValues").focus();
  return;
}

function getQuartileDict(arr) {
  var dict = {};
  dict[0] = Math.min(...arr);
  dict[25] = Quartile_25(arr);
  dict[50] = Quartile_50(arr);
  dict[75] = Quartile_75(arr);
  dict[100] = Math.max(...arr);

  return dict;
}



function Quartile_25(data) {
  return Quartile(data, 0.25);
}

function Quartile_50(data) {
  return Quartile(data, 0.5);
}

function Quartile_75(data) {
  return Quartile(data, 0.75);
}

function Quartile(data, q) {
  data.sort(compareNumbers);
  var pos = ((data.length) - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if ((data[base + 1] !== undefined)) {
    return data[base] + rest * (data[base + 1] - data[base]);
  } else {
    return data[base];
  }
}

function compareNumbers(a, b) {
  if (a == b) {
    return 0;
  }
  else if (a < b) {
    return -1;
  }
  return 1;
}

// https://www.ag-grid.com/javascript-data-grid/grid-interface/
// access the data: https://www.ag-grid.com/javascript-data-grid/accessing-data/

// ==================== attributes (headers, columndefs, tbDes) substituted for different datasets ====================

var headers;
var college_headers = {
  'College': { column: 0, dataType: 'text', summary: null, key: true, lock: 0 },
  'Type': { column: 1, dataType: 'text', summary: null, key: false, lock: 0 },
  "Applications": { column: 2, dataType: 'number', summary: null, key: false, lock: 0 },
  "Accept": { column: 3, dataType: 'number', summary: null, key: false, lock: 0 },
  "Enroll": { column: 4, dataType: 'number', summary: null, key: false, lock: 0 },
  "Full time Undergrad": { column: 5, dataType: 'number', summary: null, key: false, lock: 0 },
  "Part time Undergrad": { column: 6, dataType: 'number', summary: null, key: false, lock: 0 },
  "Out of state tuition": { column: 7, dataType: 'number', summary: null, key: false, lock: 0 },
  "Room and Board": { column: 8, dataType: 'number', summary: null, key: false, lock: 0 },
  "Estimated Book Cost": { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
  "Student/Faculty Ratio": { column: 10, dataType: 'number', summary: null, key: false, lock: 0 },
  "Graduation Rate": { column: 11, dataType: 'number', summary: null, key: false, lock: 0 }
};
var housing_headers = {
  'ID': { column: 0, dataType: 'text', summary: null, key: true, lock: 0 },
  'price': { column: 0, dataType: 'number', summary: null, key: false, lock: 0 },
  'type': { column: 1, dataType: 'text', summary: null, key: false, lock: 0 },
  'sqfeet': { column: 2, dataType: 'number', summary: null, key: false, lock: 0 },
  'beds': { column: 3, dataType: 'number', summary: null, key: false, lock: 0 },
  'baths': { column: 4, dataType: 'number', summary: null, key: false, lock: 0 },
  'comes_furnished': { column: 5, dataType: 'number', summary: null, key: false, lock: 0 },
  'wheelchair_access': { column: 6, dataType: 'number', summary: null, key: false, lock: 0 },
  'electric_vehicle_charge': { column: 7, dataType: 'number', summary: null, key: false, lock: 0 },
  'parking_options': { column: 8, dataType: 'text', summary: null, key: false, lock: 0 },
  'State': { column: 9, dataType: 'text', summary: null, key: false, lock: 0 },
};
var sales_headers = {
  'ID': { column: 0, dataType: 'text', summary: null, key: true, lock: 0 },
  'Market': { column: 1, dataType: 'text', summary: null, key: false, lock: 0 },
  'Market Size': { column: 2, dataType: 'text', summary: null, key: false, lock: 0 },
  'Product': { column: 3, dataType: 'text', summary: null, key: false, lock: 0 },
  'Product Type': { column: 4, dataType: 'text', summary: null, key: false, lock: 0 },
  'State': { column: 5, dataType: 'text', summary: null, key: false, lock: 0 },
  'Type': { column: 6, dataType: 'text', summary: null, key: false, lock: 0 },
  'Inventory': { column: 7, dataType: 'number', summary: null, key: false, lock: 0 },
  'Margin': { column: 8, dataType: 'number', summary: null, key: false, lock: 0 },
  'Marketing': { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
  'Order Size': { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
  'Profit': { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
  'Sales': { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
  'Expenses': { column: 9, dataType: 'number', summary: null, key: false, lock: 0 },
};

var columndefs = colleges_columnDefs;
var colleges_columnDefs = [
  { field: 'College', type: 'categorical', valueGetter: 'node.id' },
  { field: 'Type', type: 'categorical' },
  { field: 'Applications', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Accept', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Enroll', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Full time Undergrad', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Part time Undergrad', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Out of state tuition', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Room and Board', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Estimated Book Cost', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Student/Faculty Ratio', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Graduation Rate', type: 'numerical', filterParams: { inRangeInclusive: true } }
];
var housing_columnDefs = [
  { headerName: 'ID', type: 'categorical', valueGetter: 'node.id' },
  { field: 'price', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'type', type: 'categorical' },
  { field: 'sqfeet', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'beds', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'baths', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'comes_furnished', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'wheelchair_access', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'electric_vehicle_charge', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'parking_options', type: 'categorical' },
  { field: 'State', type: 'categorical' },
];
var sales_columnDefs = [
  { headerName: 'ID', type: 'categorical', valueGetter: 'node.id' },
  { field: 'Market', type: 'categorical' },
  { field: 'Market Size', type: 'categorical' },
  { field: 'Product', type: 'categorical' },
  { field: 'Product Type', type: 'categorical' },
  { field: 'State', type: 'categorical' },
  { field: 'Type', type: 'categorical' },
  { field: 'Inventory', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Margin', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Marketing', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Order Size', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Profit', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Sales', type: 'numerical', filterParams: { inRangeInclusive: true } },
  { field: 'Expenses', type: 'numerical', filterParams: { inRangeInclusive: true } },
];

var tbDes = 'This table contains data about colleges in America.';
