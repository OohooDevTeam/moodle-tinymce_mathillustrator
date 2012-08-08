//Canvas element and its context
var canvas, ctx;
//Width and height of the canvas
var canvasWidth, canvasHeight;
//Default font size
var fontSize = 20;
//Math elements array
var elements = new Array();
//The element that is hovered
var hover = null;
//The element that is selected
var selected = null;
var selectedX = 0;
var selectedY = 0;

//Init function
$(window).load(function () {
    //Get the canvas and its context
    canvas = $("#equation_preview");
    ctx = canvas.get(0).getContext("2d");
    //Get the width and height of the canvas
    canvasWidth = canvas.width();
    canvasHeight = canvas.height();
    canvas.attr("width", canvasWidth + "px").attr("height", canvasHeight + "px");
    //Set the default baseline and font
    ctx.textBaseline = "middle";
    ctx.font = fontSize + "px Cambria";
    //Set up the mouse and keyboard events
    canvas.on("mousemove", canvasMove).on("mousedown", canvasDown).on("mouseup mouseout", canvasUp).on("dblclick", canvasContextMenu);
    $(document).on("keydown", keyDown);

    var data = MathJax.Hub.getAllJax("MathParser")[0];
    if (data != null) {
        var x = 10;
        $.each(data.root.data[0].data, function(index, item) {
            var element = parseJax(item, x, canvasHeight/2, fontSize);
            elements = elements.concat(element);
            x += element.width;
        });
    }

    //Set the buttons as draggable
    $("#buttons .smallbutton, #buttons .bigbutton").draggable({
        cancel: "button",
        opacity: 0.7,
        revert: "invalid",
        cursorAt: {
            left: 0,
            top: 0
        },
        helper: function () {
            return $(this).children("input").clone().appendTo("body");
        },
        start: function (event, ui) {
            selected = null;
            for (var n in bigs) {
                if ($(this).children("input").val() == '\\' + bigs[n]) {
                    //selected = new BigElement(bigs[n]);
                    break;
                }
            }
            if (selected == null) {
            //selected = new ContainerElement($(this).children("input").val());
            }
            selectedX = 0;
            selectedY = 0;
        }
    });

    $("#equation_preview").droppable({
        activeClass: "canvas-active",
        tolerance: 'touch',
        over: function(event, ui) {
            //Get X position of mouse relative to the canvas
            var x = event.pageX - canvas.offset().left;
            var y = event.pageY - canvas.offset().top;

            //Must be this type of loop so that n increments at the end
            for (var n = 0; n < mathElements.length; n++) {
                if (x - selectedX < mathElements[n].x + (mathElements[n].width / 2))
                    break;
            }
            //Set the new location
            selectedPos = n;

            $(ui.helper).hide();

            selected.x = x - selectedX;
            selected.y = y - selectedY;
            addElement(selected, selectedPos);

            drawCanvas();
        },
        out: function(event, ui) {
            mathElements.splice(selectedPos, 1);
            drawCanvas();

            $(ui.helper).show();
        }
    });

    //Make tabs AFTER doing image stuff
    $("#buttons").tabs({
        selected: 0
    });

    drawCanvas();
});



function addText(element) {
    UpdateMath($(element).children().first().val());

    var data = MathJax.Hub.getAllJax("MathParser")[0];
    if (data != null) {
        if (elements.length == 0) {
            var x = 10;
        }
        else {
            var x = elements[elements.length - 1].x + elements[elements.length - 1].width;
        }
        $.each(data.root.data[0].data, function(index, item) {
            var element = parseJax(item, x, canvasHeight/2, fontSize);
            elements = elements.concat(element);
            x += element.width;
        });
    }
    drawCanvas();
}
function output() {
    var html = "";
    $.each(elements, function(index, item) {
        html += item.text();
    });
    return html;
}

function drawCanvas() {
    //Clear the canvas
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();


    $.each(elements, function(index, item) {
        item.draw();
    });

    //If an element is being hovered
    if (hover != null) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.strokeRect(hover.x, hover.y, hover.width, hover.height);
        ctx.restore();
    }

    return;


    //For each math element
    $.each(elements, function(index, item) {
        item;

        //If the element is the currently selected element
        if (item == selected) {
            var rect = [item.getX(), item.getY(), item.width, item.height];
            var img = ctx.getImageData(rect[0], rect[1], rect[2], rect[3]);
            for (var i = 0; i < img.data.length; i += 4) {
                //If pixel color isn't white
                if (img.data[i] != 255 && img.data[i+1] != 255 && img.data[i+2] != 255) {
                    //Set the alpha
                    img.data[i+3] = 128;
                }
            }
            ctx.putImageData(img, rect[0], rect[1]);
        }

        //If an element is being hovered
        if (item == hover) {
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(item.getX(), item.getY(), item.width, item.height);
            ctx.restore();
        }
    });
}

function canvasMove(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    hover = null;
    $.each(elements, function(index, item) {
        if (item.inBounds(x, y) && item != selected) {
            hover = item;
            //Returning false ends each loop
            return false;
        }
    });

    if (event.which == 1 && hover != null) {
        selected = hover;
    }

    drawCanvas();


    if (selected != null) {
        selected.x = x - (selected.width/2);
        selected.y = y - (selected.heigth/2);
    }



    return;


    hover = null;
    for (var n in mathElements) {
        if (mathElements[n].inBounds(x, y) && mathElements[n] != selected) {
            var element = mathElements[n].getElement(x, y);
            if (selected == null || element instanceof ContainerElement) {
                hover = element;
            }
            break;
        }
    }

    //Left mouse is down and something is selected
    if (event.which == 1 && selected != null) {
        //Find out where the element should be
        for (var n in mathElements) {
            if (x < mathElements[n].x + (mathElements[n].width / 2) && n < mathElements.length - 1 && x < mathElements[parseInt(n)+1].x + (mathElements[parseInt(n)+1].width / 2))
                break;
        }

        if (selectedPos != n) {
            addElement(mathElements.splice(selectedPos, 1)[0], n);

            repositionElement(0);

            selectedPos = n;
        }

        //Move the selected element
        selected.x = x - selectedX;
        selected.y = y - selectedY;
    }

    drawCanvas();
}
function canvasDown(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    //Left mouse click
    if (event.which == 1 && hover != null) {
        //hover.x = x;
        //hover.y = y;

        drawCanvas();


    //        for (var n in elements) {
    //            if (mathElements[n].inBounds(x, y)) {
    //                selected = mathElements[n];
    //
    //                //Set selected offset and position
    //                selectedX = x - selected.x;
    //                selectedY = y - selected.y;
    //                selectedPos = n;
    //
    //                drawCanvas();
    //
    //                $(canvas).css("cursor", "move");
    //                //Return false so that the cursor stays as move
    //                return false;
    //            }
    //        }
    }
}
function canvasContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();

    if (hover != null) {
        var thisHover = hover;
        hover = null;

        if (thisHover.type == "number" || thisHover.type == "char") {
            $("#TextEditor").on("keyup update", function(e) {
                UpdateMath($(this).val());

                var x = thisHover.x;
                var y = thisHover.y + (thisHover.height/2);
                var data = MathJax.Hub.getAllJax("MathParser")[0];
                if (data != null) {
                    var els = new Array();
                    $.each(data.root.data[0].data, function(index, item) {
                        var element = parseJax(item, x, y, fontSize);
                        els = els.concat(element);
                        x += element.width;
                    });

                    var lastChunk = elements.slice(hoverIndex + hoverLength);
                    elements = elements.slice(0, hoverIndex).concat(els);

                    var lastX = elements[elements.length - 1].x + elements[elements.length - 1].width;
                    $.each(lastChunk, function(index, item) {
                        item.x = lastX;
                        lastX += item.width;
                    });
                    elements = elements.concat(lastChunk);

                    hoverLength = els.length;
                }

                drawCanvas();

                if (e.keyCode == 13) {
                    $(this).blur();
                }
            }).on("blur", function() {
                $(this).hide();
            }).val(thisHover.value).focus().slideDown('slow');
        }
    }
}
function canvasUp(e) {
    //If there was something selected
    return;
    if (selected != null && e.which == 1) {
        if (hover != null && selected instanceof ContainerElement) {

            if (hover instanceof ContainerElement) {
                for (var m in surroundable) {
                    if (selected.text == surroundable[m]) {
                        var middle = surroundable[m].indexOf(" ");
                        var left = surroundable[m].substr(0, middle + 1);
                        var right = surroundable[m].substr(middle);
                        hover.setText(left + hover.text + right);
                        drawCanvas();
                        break;
                    }
                }

                hover.setText(hover.text + selected.text);

            }
            else if (hover instanceof BigElement)
                hover.eq.setText(hover.eq.text + selected.text);

            /*
            for (var m in surroundable) {
                if (selected.text == surroundable[m]) {
                    var middle = surroundable[m].indexOf(" ");
                    var left = surroundable[m].substr(0, middle + 1);
                    var right = surroundable[m].substr(middle);
                    hover.setText(left + hover.text + right);
                    drawCanvas();
                    break;
                }
            }

            for (var m in containerAcceptable) {
                if (selected.text == '\\' + containerAcceptable[m]) {
                    thisElement.setText(thisElement.text + '\\' + containerAcceptable[m]);
                    drawCanvas();
                    break;
                }
            }*/

            mathElements.splice(selectedPos, 1);
        }

        //Reset the cursor to default
        $(canvas).css("cursor", "default");

        //Reset selected
        selected = null;

        //Reposisition the selected element
        repositionElement(selectedPos);
    }
}
function keyDown(event){
    //If delete key and an element is being hovered
    if (event.keyCode == 46 && hover != null && hoverIndex != null) {
        event.preventDefault();
        event.stopPropagation();

        var x = hover.x;
        elements = elements.slice(0, hoverIndex).concat(elements.slice(hoverIndex + 1));
        for (var n = hoverIndex; n < elements.length; n++) {
            elements[n].x = x;
            x += elements[n].width;
        }

        hover = null;
        hoverIndex = null;
        hoverLength = null;

        drawCanvas();
    }
}

function addVector(matrixType) {
    jPrompt('Number of rows:', 3, 'Vector', function(r1) {
        if(r1 != null) {
            var tex = "\\begin{" + matrixType + "} ";
            for (var i = 0; i < r1; i++) {
                for (var j = 0; j < 1; j++) {
                    tex += "& ";
                }
                tex = tex.slice(0, -3);
                tex += "\\\\ ";
            }
            tex = tex.slice(0, -3);
            tex += " \\end{" + matrixType + "}";

            UpdateMath(tex);

            var x = 0;
            if (elements.length > 0) {
                x = elements[elements.length - 1].x + elements[elements.length - 1].width;
            }
            var y = canvasHeight/2;
            var data = MathJax.Hub.getAllJax("MathParser")[0];
            if (data != null) {
                $.each(data.root.data[0].data, function(index, item) {
                    var element = parseJax(item, x, y, fontSize);
                    elements = elements.concat(element);
                    x += element.width;
                });
            }
            drawCanvas();
        }
    });
}
function addMatrix(braceType) {
    jPrompt2('Number of rows:', 3, 'Number of columns', 3, 'Matrix', function(r1, r2) {
        if(r1 != null && r2 != null) {
            addElement(new MatrixElement(r1, r2, braceType));
        }
    });
}


function getTextWidth(text, fontSize, fontStyle) {
    ctx.save();
    ctx.font = (fontStyle != null ? fontStyle + " " : "") + fontSize + "px Cambria";
    var width = ctx.measureText(text).width;
    ctx.restore();

    return width;
}

function Element(type, value, parent) {
    //Type of the element and its value
    this.type = type;
    this.value = value;
    //Img object if it has one
    this.img = null;
    //X and Y position
    this.x = null;
    this.y = null;
    //Width and height of the element
    this.width = null;
    this.height = null;
    //Children array if it has any
    this.children = null;

    this.parent = parent;
}
Element.prototype.inBounds = function(X, Y) {
    //Return true if X and Y are within the bounds of the element
    if (X > this.x && X < this.x + this.width && Y > this.y && Y < this.y + this.height) {
        return true;
    }
    //Otherwise return false
    else {
        return false;
    }
}
Element.prototype.draw = function() {
    if (this.type == "none") {
        ctx.strokeRect(this.x, this.y - (this.height/2), this.width, this.height);
    }
    else if (this.type == "number" || this.type == "char" || this.type == "chars" || this.type == "opchar") {
        ctx.save();
        if (this.type == "char") {
            ctx.font = "italic " + this.height + "px Cambria";
        }
        else {
            ctx.font = this.height + "px Cambria";
        }
        ctx.fillText(this.value, this.x, this.y);
        ctx.restore();
    }
    else if (this.type == "symbol") {
        ctx.drawImage(this.img, this.x, this.y - (this.img.height/2), this.width, this.img.height*(this.height/18));
    }
    else if (this.type == "opsymbol") {
        ctx.drawImage(this.img, this.x, this.y - (this.height/2), this.width, this.height);
    }
    else if (this.type == "underover" || this.type == "subsup") {
        this.value.draw();
        if (this.children[0] != null) {
            this.children[0].draw();
        }
        if (this.children[1] != null) {
            this.children[1].draw();
        }
    }
    else if (this.type == "row") {
        $.each(this.children, function(index, item) {
            item.draw();
        });
    }
    else if (this.type == "root") {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + (this.height/2) - 10);
        ctx.lineTo(this.x + 5, this.y + (this.height/2));
        ctx.lineTo(this.value.x, this.y - (this.height/2));
        ctx.lineTo(this.value.x + this.value.width, this.y - (this.height/2));
        ctx.stroke();
        this.value.draw();
    }
    else if (this.type == "frac") {
        this.children[0].draw();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.stroke();
        this.children[1].draw();
    }
    else if (this.type == "fenced") {
        ctx.save();
        ctx.font = this.height + "px Cambria";
        ctx.fillText(this.open, this.x, this.y);
        this.value.draw();
        ctx.fillText(this.close, this.value.x + this.value.width, this.y);
        ctx.restore();
    }
    else if (this.type == "table") {
        $.each(this.children, function(index, item) {
            $.each(item, function(index, item) {
                item.draw();
            });
        });
    }
}
Element.prototype.text = function() {
    return "-";
}

function parseJax(jax, x, y, fontSize) {
    //The object that gets returned
    var element = null;
    //If jax exists
    if (jax != null) {
        if (jax.type == "mn") {
            element = new Element("number", jax.data[0].data[0]);
            element.x = x;
            element.y = y;
            element.width = getTextWidth(element.value, fontSize);
            element.height = fontSize;
        }
        else if (jax.type == "mi") {
            if (jax.data[0].type == "chars") {
                element = new Element(jax.data[0].data[0].length == 1 ? "char" : "chars", jax.data[0].data[0]);
                element.width = getTextWidth(element.value, fontSize, "italic");
            }
            else if (jax.data[0].type == "entity") {
                element = new Element("symbol", entityConversion[jax.data[0].data[0]]);
                element.img = new Image();
                element.img.src = "../images/" + element.value + ".png";
                element.width = element.img.width;
            }
            element.x = x;
            element.y = y;
            element.height = fontSize;
        }
        else if (jax.type == "munderover") {
            var el = parseJax(jax.data[0], null, null, fontSize);
            var ch1 = parseJax(jax.data[1], null, null, fontSize*0.65);
            var ch2 = parseJax(jax.data[2], null, null, fontSize*0.65);

            var width = Math.max(el.width, ch1.width, ch2.width);
            var height = el.height + ch1.height + ch2.height;

            element = new Element("underover", parseJax(jax.data[0], x + ((width - el.width)/2), y, fontSize));
            element.children = new Array();
            element.children.push(parseJax(jax.data[1], x + ((width - ch1.width)/2), y + ((el.height + ch1.height)/2), fontSize*0.65));
            element.children.push(parseJax(jax.data[2], x + ((width - ch2.width)/2), y - ((el.height + ch2.height)/2), fontSize*0.65));
            element.x = x;
            element.y = y;
            element.width = width;
            element.height = height;
        }
        else if (jax.type == "msubsup") {
            var el = parseJax(jax.data[0], null, null, fontSize);
            var ch1 = parseJax(jax.data[1], null, null, fontSize*0.65);
            var ch2 = parseJax(jax.data[2], null, null, fontSize*0.65);

            var width = el.width + Math.max(ch1.width, ch2.width);
            var height = el.height + ch1.height + ch2.height;

            element = new Element("subsup", parseJax(jax.data[0], x, y, fontSize));
            element.children = new Array();
            element.children.push(parseJax(jax.data[1], x + el.width, y + ((el.height + ch1.height)/2), fontSize*0.65));
            element.children.push(parseJax(jax.data[2], x + el.width, y - ((el.height + ch2.height)/2), fontSize*0.65));
            element.x = x;
            element.y = y - (height/2);
            element.width = width;
            element.height = height;
        }
        else if (jax.type == "texatom") {
            element = parseJax(jax.data[0], x, y, fontSize);
        }
        else if (jax.type == "mrow") {
            if (jax.data.length == 1) {
                element = parseJax(jax.data[0], x, y, fontSize);
            }
            else {
                element = new Element("row", null);
                element.x = x;
                element.y = y;
                element.width = 0;
                element.height = 0;
                element.children = new Array();
                var dx = x;
                $.each(jax.data, function(index, item) {
                    var el = parseJax(item, dx, y, fontSize);
                    element.children.push(el);
                    element.width += el.width;
                    element.height = Math.max(el.height, element.height);
                    dx += el.width;
                });
            }
        }
        else if (jax.type == "msqrt" || jax.type == "mroot") {
            element = new Element("root", parseJax(jax.data[0], x + 10, y, fontSize));
            if (jax.data[1] != null) {
                element.children = parseJax(jax.data[1], x, y, fontSize);
            }
            element.x = x;
            element.y = y;
            element.width = element.value.width + 10;
            element.height = element.value.height;
        }
        else if (jax.type == "mfrac") {
            var top = parseJax(jax.data[0], null, null, fontSize);
            var bottom = parseJax(jax.data[1], null, null, fontSize);

            var width = Math.max(top.width, bottom.width);
            var height = top.height + bottom.height;

            element = new Element("frac", null);
            element.children = new Array();
            element.children.push(parseJax(jax.data[0], x + ((width - top.width)/2), y - (top.height/2), fontSize));
            element.children.push(parseJax(jax.data[1], x + ((width - bottom.width)/2), y + (bottom.height/2), fontSize));
            element.x = x;
            element.y = y;
            element.width = width;
            element.height = height;
        }
        else if (jax.type == "mfenced") {
            var el = parseJax(jax.data[0], null, null, fontSize);
            element = new Element("fenced", parseJax(jax.data[0], x + getTextWidth(jax.open, el.height), y - (el.height/3), fontSize));
            element.x = x;
            element.y = y;
            element.width = element.value.width;
            element.height = element.value.height;
            element.open = jax.open;
            element.close = jax.close;
        }
        else if (jax.type == "mtable") {
            var els = new Array();
            var colWidths = new Array();
            var rowHeights = new Array();
            $.each(jax.data, function(index, item) {
                var row = new Array();
                $.each(item.data, function(index, item) {
                    row.push(parseJax(item.data[0], null, null, fontSize));
                    colWidths[index] = 0;
                });
                els.push(row);
                rowHeights.push(0);
            });
            $.each(els, function(indexRow, item) {
                $.each(item, function(indexCol, item) {
                    colWidths[indexCol] = Math.max(item.width, colWidths[indexCol]);
                    rowHeights[indexRow] = Math.max(item.height, rowHeights[indexRow]);
                });
            });

            element = new Element("table", null);
            element.children = new Array();
            var dx;
            var dy = y;
            $.each(jax.data, function(indexRow, item) {
                var row = new Array();
                dx = x;
                $.each(item.data, function(indexCol, item2) {
                    row.push(parseJax(item2.data[0], dx + ((colWidths[indexCol] - els[indexRow][indexCol].width)/2), dy, fontSize));
                    dx += colWidths[indexCol];
                    if (indexCol + 1 < item.data.length) {
                        dx += 15;
                    }
                });
                element.children.push(row);
                dy += rowHeights[indexRow]/2;
                if (indexRow + 1 < jax.data.length) {
                    dy += (rowHeights[indexRow + 1]/2) + 5;
                }
            });
            element.x = x;
            element.y = y;
            element.width = dx - x;
            element.height = dy - y;
        }



















        ///////////////////TODO: Check if array really needed///////////////////
        else if (jax.type == 'mo') {
            element = new Array();
            var dx = x;
            $.each(jax.data, function(index, item) {
                var el = null;
                if (item.type == 'chars') {
                    el = new Element('opchar', item.data[0]);
                    el.width = getTextWidth(el.value, fontSize);
                    el.height = fontSize;
                }
                else if (item.type == 'entity' && entityConversion[item.data[0]] != "ApplyFunction") {
                    el = new Element('opsymbol', entityConversion[item.data[0]]);
                    el.img = new Image();
                    el.img.src = '../images/' + el.value + '.png';
                    el.width = el.img.width*(fontSize/18);
                    el.height = el.img.height*(fontSize/18);
                }
                el.x = dx;
                el.y = y;
                element.push(el);
                dx += el.width;
            });

            if (element.length == 1) {
                element = element[0];
            }
        }
    }
    else {
        element = new Element("none", null);
        element.x = x;
        element.y = y;
        element.width = fontSize;
        element.height = fontSize;
    }
    return element;
}

var entityConversion = {
    '#x2061': 'ApplyFunction',
    '#x2216': 'Backslash',
    '#x2235': 'Because',
    '#x02D8': 'Breve',
    '#x22D2': 'Cap',
    '#x00B7': 'CenterDot',
    '#x2299': 'CircleDot',
    '#x2296': 'CircleMinus',
    '#x2295': 'CirclePlus',
    '#x2297': 'CircleTimes',
    '#x2261': 'Congruent',
    '#x222E': 'ContourIntegral',
    '#x2210': 'Coproduct',
    '#x2A2F': 'Cross',
    '#x22D3': 'Cup',
    '#x224D': 'CupCap',
    '#x2021': 'Dagger',
    '#x2207': 'Del',
    '#x0394': 'Delta',
    '#x22C4': 'Diamond',
    '#x2146': 'DifferentialD',
    '#x2250': 'DotEqual',
    '#x00A8': 'DoubleDot',
    '#x22A8': 'DoubleRightTee',
    '#x2225': 'DoubleVerticalBar',
    '#x2193': 'DownArrow',
    '#x21BD': 'DownLeftVector',
    '#x21C1': 'DownRightVector',
    '#x22A4': 'DownTee',
    '#x21D3': 'Downarrow',
    '#x2208': 'Element',
    '#x2242': 'EqualTilde',
    '#x21CC': 'Equilibrium',
    '#x2203': 'Exists',
    '#x2147': 'ExponentialE',
    '#x25AA': 'FilledVerySmallSquare',
    '#x2200': 'ForAll',
    '#x0393': 'Gamma',
    '#x22D9': 'Gg',
    '#x2265': 'GreaterEqual',
    '#x22DB': 'GreaterEqualLess',
    '#x2267': 'GreaterFullEqual',
    '#x2277': 'GreaterLess',
    '#x2A7E': 'GreaterSlantEqual',
    '#x2273': 'GreaterTilde',
    '#x02C7': 'Hacek',
    '#x005E': 'Hat',
    '#x224E': 'HumpDownHump',
    '#x224F': 'HumpEqual',
    '#x2111': 'Im',
    '#x2148': 'ImaginaryI',
    '#x222B': 'Integral',
    '#x22C2': 'Intersection',
    '#x2063': 'InvisibleComma',
    '#x2062': 'InvisibleTimes',
    '#x039B': 'Lambda',
    '#x219E': 'Larr',
    '#x27E8': 'LeftAngleBracket',
    '#x2190': 'LeftArrow',
    '#x21C6': 'LeftArrowRightArrow',
    '#x2308': 'LeftCeiling',
    '#x21C3': 'LeftDownVector',
    '#x230A': 'LeftFloor',
    '#x2194': 'LeftRightArrow',
    '#x22A3': 'LeftTee',
    '#x22B2': 'LeftTriangle',
    '#x22B4': 'LeftTriangleEqual',
    '#x21BF': 'LeftUpVector',
    '#x21BC': 'LeftVector',
    '#x21D0': 'Leftarrow',
    '#x21D4': 'Leftrightarrow',
    '#x22DA': 'LessEqualGreater',
    '#x2266': 'LessFullEqual',
    '#x2276': 'LessGreater',
    '#x2A7D': 'LessSlantEqual',
    '#x2272': 'LessTilde',
    '#x22D8': 'Ll',
    '#x21DA': 'Lleftarrow',
    '#x27F5': 'LongLeftArrow',
    '#x27F7': 'LongLeftRightArrow',
    '#x27F6': 'LongRightArrow',
    '#x27F8': 'Longleftarrow',
    '#x27FA': 'Longleftrightarrow',
    '#x27F9': 'Longrightarrow',
    '#x21B0': 'Lsh',
    '#x2213': 'MinusPlus',
    '#x226B': 'NestedGreaterGreater',
    '#x226A': 'NestedLessLess',
    '#x2226': 'NotDoubleVerticalBar',
    '#x2209': 'NotElement',
    '#x2260': 'NotEqual',
    '#x2204': 'NotExists',
    '#x226F': 'NotGreater',
    '#x2271': 'NotGreaterEqual',
    '#x22EA': 'NotLeftTriangle',
    '#x22EC': 'NotLeftTriangleEqual',
    '#x226E': 'NotLess',
    '#x2270': 'NotLessEqual',
    '#x2280': 'NotPrecedes',
    '#x22E0': 'NotPrecedesSlantEqual',
    '#x22EB': 'NotRightTriangle',
    '#x22ED': 'NotRightTriangleEqual',
    '#x2288': 'NotSubsetEqual',
    '#x2281': 'NotSucceeds',
    '#x22E1': 'NotSucceedsSlantEqual',
    '#x2289': 'NotSupersetEqual',
    '#x2241': 'NotTilde',
    '#x2224': 'NotVerticalBar',
    '#x03A9': 'Omega',
    '#x203E': 'OverBar',
    '#x23DE': 'OverBrace',
    '#x2202': 'PartialD',
    '#x03A6': 'Phi',
    '#x03A0': 'Pi',
    '#x00B1': 'PlusMinus',
    '#x227A': 'Precedes',
    '#x2AAF': 'PrecedesEqual',
    '#x227C': 'PrecedesSlantEqual',
    '#x227E': 'PrecedesTilde',
    '#x220F': 'Product',
    '#x221D': 'Proportional',
    '#x03A8': 'Psi',
    '#x21A0': 'Rarr',
    '#x211C': 'Re',
    '#x21CB': 'ReverseEquilibrium',
    '#x27E9': 'RightAngleBracket',
    '#x2192': 'RightArrow',
    '#x21C4': 'RightArrowLeftArrow',
    '#x2309': 'RightCeiling',
    '#x21C2': 'RightDownVector',
    '#x230B': 'RightFloor',
    '#x22A2': 'RightTee',
    '#x21A6': 'RightTeeArrow',
    '#x22B3': 'RightTriangle',
    '#x22B5': 'RightTriangleEqual',
    '#x21BE': 'RightUpVector',
    '#x21C0': 'RightVector',
    '#x21D2': 'Rightarrow',
    '#x21DB': 'Rrightarrow',
    '#x21B1': 'Rsh',
    '#x03A3': 'Sigma',
    '#x2218': 'SmallCircle',
    '#x221A': 'Sqrt',
    '#x25A1': 'Square',
    '#x2293': 'SquareIntersection',
    '#x228F': 'SquareSubset',
    '#x2291': 'SquareSubsetEqual',
    '#x2290': 'SquareSuperset',
    '#x2292': 'SquareSupersetEqual',
    '#x2294': 'SquareUnion',
    '#x22C6': 'Star',
    '#x22D0': 'Subset',
    '#x2286': 'SubsetEqual',
    '#x227B': 'Succeeds',
    '#x2AB0': 'SucceedsEqual',
    '#x227D': 'SucceedsSlantEqual',
    '#x227F': 'SucceedsTilde',
    '#x220B': 'SuchThat',
    '#x2211': 'sum',
    '#x2283': 'Superset',
    '#x2287': 'SupersetEqual',
    '#x22D1': 'Supset',
    '#x2234': 'Therefore',
    '#x0398': 'Theta',
    '#x223C': 'Tilde',
    '#x2243': 'TildeEqual',
    '#x2245': 'TildeFullEqual',
    '#x2248': 'TildeTilde',
    '#x005F': 'UnderBar',
    '#x23DF': 'UnderBrace',
    '#x22C3': 'Union',
    '#x228E': 'UnionPlus',
    '#x2191': 'UpArrow',
    '#x2195': 'UpDownArrow',
    '#x22A5': 'UpTee',
    '#x21D1': 'Uparrow',
    '#x21D5': 'Updownarrow',
    '#x03A5': 'Upsilon',
    '#x22A9': 'Vdash',
    '#x22C1': 'Vee',
    '#x2223': 'VerticalBar',
    '#x2240': 'VerticalTilde',
    '#x22AA': 'Vvdash',
    '#x22C0': 'Wedge',
    '#x039E': 'Xi',
    '#x00B4': 'acute',
    '#x2135': 'aleph',
    '#x03B1': 'alpha',
    '#x2A3F': 'amalg',
    '#x2227': 'and',
    '#x2220': 'ang',
    '#x2221': 'angmsd',
    '#x2222': 'angsph',
    '#x224A': 'ape',
    '#x2035': 'backprime',
    '#x223D': 'backsim',
    '#x22CD': 'backsimeq',
    '#x03B2': 'beta',
    '#x2136': 'beth',
    '#x226C': 'between',
    '#x25EF': 'bigcirc',
    '#x2A00': 'bigodot',
    '#x2A01': 'bigoplus',
    '#x2A02': 'bigotimes',
    '#x2A06': 'bigsqcup',
    '#x2605': 'bigstar',
    '#x25BD': 'bigtriangledown',
    '#x25B3': 'bigtriangleup',
    '#x2A04': 'biguplus',
    '#x29EB': 'blacklozenge',
    '#x25B4': 'blacktriangle',
    '#x25BE': 'blacktriangledown',
    '#x25C2': 'blacktriangleleft',
    '#x22C8': 'bowtie',
    '#x2510': 'boxdl',
    '#x250C': 'boxdr',
    '#x229F': 'boxminus',
    '#x229E': 'boxplus',
    '#x22A0': 'boxtimes',
    '#x2518': 'boxul',
    '#x2514': 'boxur',
    '#x005C': 'bsol',
    '#x2022': 'bull',
    '#x2229': 'cap',
    '#x2713': 'check',
    '#x03C7': 'chi',
    '#x02C6': 'circ',
    '#x2257': 'circeq',
    '#x21BA': 'circlearrowleft',
    '#x21BB': 'circlearrowright',
    '#x00AE': 'circledR',
    '#x24C8': 'circledS',
    '#x229B': 'circledast',
    '#x229A': 'circledcirc',
    '#x229D': 'circleddash',
    '#x2663': 'clubs',
    '#x003A': 'colon',
    '#x2201': 'comp',
    '#x22EF': 'ctdot',
    '#x22DE': 'cuepr',
    '#x22DF': 'cuesc',
    '#x21B6': 'cularr',
    '#x222A': 'cup',
    '#x21B7': 'curarr',
    '#x22CE': 'curlyvee',
    '#x22CF': 'curlywedge',
    '#x2020': 'dagger',
    '#x2138': 'daleth',
    '#x21CA': 'ddarr',
    '#x00B0': 'deg',
    '#x03B4': 'delta',
    '#x03DD': 'digamma',
    '#x00F7': 'div',
    '#x22C7': 'divideontimes',
    '#x02D9': 'dot',
    '#x2251': 'doteqdot',
    '#x2214': 'dotplus',
    '#x22A1': 'dotsquare',
    '#x22F1': 'dtdot',
    '#x2256': 'ecir',
    '#x2252': 'efDot',
    '#x2A96': 'egs',
    '#x2113': 'ell',
    '#x2A95': 'els',
    '#x2205': 'empty',
    '#x03B5': 'epsi',
    '#x03F5': 'epsiv',
    '#x2253': 'erDot',
    '#x03B7': 'eta',
    '#x00F0': 'eth',
    '#x266D': 'flat',
    '#x22D4': 'fork',
    '#x2322': 'frown',
    '#x2A8C': 'gEl',
    '#x03B3': 'gamma',
    '#x2A86': 'gap',
    '#x2137': 'gimel',
    '#x2269': 'gnE',
    '#x2A8A': 'gnap',
    '#x2A88': 'gne',
    '#x22E7': 'gnsim',
    '#x003E': 'gt',
    '#x22D7': 'gtdot',
    '#x21AD': 'harrw',
    '#x210F': 'hbar',
    '#x2026': 'hellip',
    '#x21A9': 'hookleftarrow',
    '#x21AA': 'hookrightarrow',
    '#x0131': 'imath',
    '#x221E': 'infty',
    '#x22BA': 'intcal',
    '#x03B9': 'iota',
    '#x0237': 'jmath',
    '#x03BA': 'kappa',
    '#x03F0': 'kappav',
    '#x2A8B': 'lEg',
    '#x03BB': 'lambda',
    '#x2A85': 'lap',
    '#x21AB': 'larrlp',
    '#x21A2': 'larrtl',
    '#x007B': 'lbrace',
    '#x005B': 'lbrack',
    '#x2264': 'le',
    '#x21C7': 'leftleftarrows',
    '#x22CB': 'leftthreetimes',
    '#x22D6': 'lessdot',
    '#x23B0': 'lmoust',
    '#x2268': 'lnE',
    '#x2A89': 'lnap',
    '#x2A87': 'lne',
    '#x22E6': 'lnsim',
    '#x27FC': 'longmapsto',
    '#x21AC': 'looparrowright',
    '#x2217': 'lowast',
    '#x25CA': 'loz',
    '#x003C': 'lt',
    '#x22C9': 'ltimes',
    '#x25C3': 'ltri',
    '#x00AF': 'macr',
    '#x2720': 'malt',
    '#x2127': 'mho',
    '#x03BC': 'mu',
    '#x22B8': 'multimap',
    '#x21CD': 'nLeftarrow',
    '#x21CE': 'nLeftrightarrow',
    '#x21CF': 'nRightarrow',
    '#x22AF': 'nVDash',
    '#x22AE': 'nVdash',
    '#x266E': 'natur',
    '#x2197': 'nearr',
    '#x21AE': 'nharr',
    '#x219A': 'nlarr',
    '#x00AC': 'not',
    '#x219B': 'nrarr',
    '#x03BD': 'nu',
    '#x22AD': 'nvDash',
    '#x22AC': 'nvdash',
    '#x2196': 'nwarr',
    '#x03C9': 'omega',
    '#x03BF': 'omicron',
    '#x2228': 'or',
    '#x2298': 'osol',
    '#x002E': 'period',
    '#x03C6': 'phi',
    '#x03D5': 'phiv',
    '#x03C0': 'pi',
    '#x03D6': 'piv',
    '#x2AB7': 'prap',
    '#x2AB9': 'precnapprox',
    '#x2AB5': 'precneqq',
    '#x22E8': 'precnsim',
    '#x2032': 'prime',
    '#x03C8': 'psi',
    '#x21A3': 'rarrtl',
    '#x007D': 'rbrace',
    '#x005D': 'rbrack',
    '#x03C1': 'rho',
    '#x03F1': 'rhov',
    '#x21C9': 'rightrightarrows',
    '#x22CC': 'rightthreetimes',
    '#x02DA': 'ring',
    '#x23B1': 'rmoust',
    '#x22CA': 'rtimes',
    '#x25B9': 'rtri',
    '#x2AB8': 'scap',
    '#x2AB6': 'scnE',
    '#x2ABA': 'scnap',
    '#x22E9': 'scnsim',
    '#x22C5': 'sdot',
    '#x2198': 'searr',
    '#x00A7': 'sect',
    '#x266F': 'sharp',
    '#x03C3': 'sigma',
    '#x03C2': 'sigmav',
    '#x2246': 'simne',
    '#x2323': 'smile',
    '#x2660': 'spades',
    '#x2282': 'sub',
    '#x2AC5': 'subE',
    '#x2ACB': 'subnE',
    '#x228A': 'subne',
    '#x2AC6': 'supE',
    '#x2ACC': 'supnE',
    '#x228B': 'supne',
    '#x2199': 'swarr',
    '#x03C4': 'tau',
    '#x03B8': 'theta',
    '#x03D1': 'thetav',
    '#x02DC': 'tilde',
    '#x00D7': 'times',
    '#x25B5': 'triangle',
    '#x225C': 'triangleq',
    '#x03C5': 'upsi',
    '#x21C8': 'upuparrows',
    '#x22BB': 'veebar',
    '#x22EE': 'vellip',
    '#x2118': 'weierp',
    '#x03BE': 'xi',
    '#x00A5': 'yen',
    '#x03B6': 'zeta',
    '#x21DD': 'zigrarr'
};
