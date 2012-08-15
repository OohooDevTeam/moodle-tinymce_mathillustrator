/* * **********************************************************************
 * *                         MathIllustrator                             **
 * ************************************************************************
 * @package     tinymce                                                  **
 * @subpackage  mathillustrator                                          **
 * @name        MathIllustrator                                          **
 * @copyright   oohoo.biz                                                **
 * @link        http://oohoo.biz                                         **
 * @author      Braedan Jongerius <jongeriu@ualberta.ca> 2012            **
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later **
 * ************************************************************************
 * ********************************************************************** */

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
var hoverIndex = null;
var hoverLength = 0;
//The element that is selected
var selected = null;
var selectedX = 0;
var selectedY = 0;
//The old selected location
var oldSelectedX = 0;
var oldSelectedY = 0;

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
    canvas.on("mousemove", canvasMove).on("mousedown", canvasDown).on("mouseup mouseout", canvasUp).on("dblclick", canvasContextMenu).on("touchstart", touchCanvas).on("touchstop", canvasUp);
    $(document).on("keydown", keyDown);

    var data = MathJax.Hub.getAllJax("MathParser")[0];
    if (data != null) {
        var x = 10;
        $.each(data.root.data[0].data, function(index, item) {
            var element = parseJax(item, fontSize);
            element.update(x, canvasHeight/2);
            elements = elements.concat(element);
            x += element.width;
        });
    }

    //Make the buttons draggable
    $("#buttons .smallbutton, #buttons .bigbutton").draggable({
        cancel: "button",
        opacity: 0.7,
        revert: "invalid",
        helper: function () {
            return $(this).children("input").clone().appendTo("body");
        },
        start: function (event, ui) {
            selected = null;
            UpdateMath($(this).children("input").val());
            var data = MathJax.Hub.getAllJax("MathParser")[0];
            if (data != null) {
                selected = parseJax(data.root.data[0].data[0], 200, canvasHeight/2, fontSize);
            }
        }
    });
    $("#equation_preview").droppable({
        activeClass: "canvas-active",
        tolerance: 'touch',
        over: function(event, ui) {
            //Get X position of mouse relative to the canvas
            var x = event.pageX - canvas.offset().left;
            var y = event.pageY - canvas.offset().top;

            $(ui.helper).hide();

            elements = elements.concat(selected);

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

/**
 * Add an element
 * @param type element
 */
function addText(element) {
    UpdateMath($(element).children().first().val());

    var data = MathJax.Hub.getAllJax("MathParser")[0];
    if (data != null) {
        var x = 10;
        if (elements.length != 0) {
            x = elements[elements.length - 1].x + elements[elements.length - 1].width;
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
    var html = "$$ ";
    $(elements).each(function(index, item) {
        html += item.text();
    });
    return html + " $$";
}

/**
 * Draw the canvas
 * @return void
 */
function drawCanvas() {
    //Clear the canvas
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(0, canvasHeight/2);
    ctx.lineTo(canvasWidth, canvasHeight/2);
    ctx.stroke();

    //Draw each element
    $(elements).each(function(index, item) {
        item.draw();
    });

    //If an element is being hovered
    if (hover != null) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.strokeRect(hover.x, hover.y, hover.width, hover.height);
        ctx.restore();
    }

    if (selected != null) {
        var rect = [selected.x, selected.y, selected.width, selected.height];
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
}

function canvasMove(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    hover = null;
    hoverIndex = null;

    $.each(elements, function(index, item) {
        var found = item.getElement(x, y);
        if (found != null && found != selected) {
            hover = found;
            hoverIndex = index;
            return false
        }
    });

    if (event.which == 1 && selected != null) {
        selected.update(x - selectedX, y - selectedY);
    }

    drawCanvas();

    return;


   

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

    selected = null;
    //Left mouse click
    if (event.which == 1 && hover != null) {
        selected = hover;
        selectedX = x - hover.x;
        selectedY = y - (hover.y + (hover.height/2));
        oldSelectedX = hover.x;
        oldSelectedY = hover.y + (hover.height/2);

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

    selected = null;
    if (hover != null) {
        selected = hover;
        hover = null;

        if (selected.type == "number" || selected.type == "char") {
            $("#TextEditor").on("keyup update", function(e) {
                UpdateMath($(this).val());

                var x = selected.x;
                var y = selected.y;
                var data = MathJax.Hub.getAllJax("MathParser")[0];
                if (data != null) {
                    var els = new Array();
                    $.each(data.root.data[0].data, function(index, item) {
                        var el = parseJax(item, x, y, fontSize);
                        els = els.concat(el);
                        x += el.width;
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
                    elements = elements.concat(els);
                }

                drawCanvas();

                if (e.keyCode == 13) {
                    $(this).blur();
                }
            }).on("blur", function() {
                $(this).hide();
            }).val(selected.value).focus().slideDown('slow');
        }
    }
}
function canvasUp(e) {
    if (selected != null) {

        if (hover == null) {
            UpdateMath(selected.text());
            var data = MathJax.Hub.getAllJax("MathParser")[0];
            if (data != null) {
                var x = elements[elements.length - 1].x + elements[elements.length - 1].width;

                var element = parseJax(data.root.data[0].data[0], fontSize);
                element.update(x, canvasHeight/2);
                elements = elements.concat(element);
            }
            if (elements.indexOf(selected) == -1) {
                selected.type = "none";
            }
        }
        else if (hover.type == "none") {
            UpdateMath(selected.text());
            var data = MathJax.Hub.getAllJax("MathParser")[0];
            if (data != null) {
                var oldX = hover.x;
                var oldY = hover.y;

                var newObj = parseJax(data.root.data[0].data[0], hover.nestedSize);
                hover.type = newObj.type;
                hover.children = newObj.children;


                hover.update(oldX, oldY, hover.nestedSize);
                return;
            }
        }

        selected.update(oldSelectedX, oldSelectedY);

        selected = null;
        selectedX = 0;
        selectedY = 0;
        oldSelectedX = 0;
        oldSelectedY = 0;
    }

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
            else if (hover instanceof BigElement) {
                hover.eq.setText(hover.eq.text + selected.text);
            }



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

        elements = elements.slice(0, hoverIndex).concat(elements.slice(hoverIndex + 1));
        var x = 10;
        if (hoverIndex > 0) {
            x = elements[hoverIndex - 1].x + elements[hoverIndex - 1].width;
        }

        for (var n = hoverIndex; n < elements.length; n++) {
            elements[n].update(x, canvasHeight/2);
            x += elements[n].width;
        }

        drawCanvas();
    }
}
function touchCanvas(event) {
    var t2 = event.timeStamp
    , t1 = $(this).data('lastTouch') || t2
    , dt = t2 - t1
    , fingers = event.originalEvent.touches.length;
    $(this).data('lastTouch', t2);
    if (dt || dt <= 500 || fingers >= 1) {
        event.preventDefault(); // double tap - prevent the zoom
        // also synthesize click events we just swallowed up
        return canvasContextMenu(event);
    //$(this).trigger('click').trigger('click');
    }
}

function addVector(matrixType) {
    jPrompt('Number of rows:', 3, 'Vector', function(r1) {
        if(r1 != null) {
            var tex = "\\begin{" + matrixType + "} ";
            for (var i = 0; i < r1; i++) {
                tex += "1 \\\\ ";
            }
            tex = tex.slice(0, -4);
            tex += " \\end{" + matrixType + "}";

            UpdateMath(tex);

            var x = 10;
            if (elements.length > 0) {
                x = elements[elements.length - 1].x + elements[elements.length - 1].width;
            }
            var data = MathJax.Hub.getAllJax("MathParser")[0];
            if (data != null) {
                var element = parseJax(data.root.data[0].data[0], x, canvasHeight/2, fontSize);
                elements = elements.concat(element);
                x += element.width;
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

/**
 * Gets the width of some text in a specified font size and type
 * @param string text The text to measure
 * @param number fontSize The font size in px
 * @param mixed fontStyle ("italic"|null)
 * @return number The width of the text
 */
function getTextWidth(text, fontSize, fontStyle) {
    ctx.save();
    ctx.font = (fontStyle != null ? fontStyle + " " : "") + fontSize + "px Cambria";
    var width = ctx.measureText(text).width;
    ctx.restore();

    return width;
}










function Element(type, nestedSize) {
    //Type of element
    this.type = type;
    //Children array of values
    this.children = new Array();

    //X and Y position
    this.x = null;
    this.y = null;
    //Width and height
    this.width = null;
    this.height = null;
    //Size of element
    this.nestedSize = nestedSize;
}
Element.prototype.draw = function() {
    if (this.type == "none") {
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    else if (this.type == "number" || this.type == "char" || this.type == "chars" || this.type == "opchar") {
        ctx.save();
        ctx.font = ((this.type == "char") ? "italic " : "") + this.height + "px Cambria";
        ctx.fillText(this.children[0], this.x, this.y + (this.height/2));
        ctx.restore();
    }
    else if (this.type == "symbol" || this.type == "opsymbol") {
        ctx.drawImage(this.children[0], this.x, this.y - ((this.type == "symbol") ? ((this.children[0].height - this.height)/2) : 0), this.width, this.children[0].height);
    }
    else if (this.type == "subsup" || this.type == "underover") {
        this.children[0].draw();
        if (this.children[1] != null) {
            this.children[1].draw();
        }
        if (this.children[2] != null) {
            this.children[2].draw();
        }
    }







    else if (this.type == "row") {
        $.each(this.children, function(index, item) {
            item.draw();
        });
    }
    else if (this.type == "root") {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height - 10);
        ctx.lineTo(this.x + 5, this.y + this.height);
        ctx.lineTo(this.value.x, this.y);
        ctx.lineTo(this.value.x + this.value.width, this.y);
        ctx.stroke();
        this.value.draw();
    }
    else if (this.type == "frac") {
        this.children[0].draw();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + (this.height/2));
        ctx.lineTo(this.x + this.width, this.y + (this.height/2));
        ctx.stroke();
        this.children[1].draw();
    }
    else if (this.type == "fenced") {
        ctx.save();
        ctx.font = this.height + "px Cambria";
        ctx.fillText(this.open, this.x, this.y + (this.height/2));
        this.value.draw();
        ctx.fillText(this.close, this.value.x + this.value.width, this.y + (this.height/2));
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
Element.prototype.getElement = function(X, Y) {
    var element = null;

    if (this.inBounds(X, Y)) {

        if (this.children != null && element == null) {
            $.each(this.children, function(index, item) {
                var el = null;
                if (item instanceof Array) {
                    $.each(item, function(index, item2) {
                        el = item2.getElement(X, Y);
                        if(el != null) {
                            return false;
                        }
                    });
                }
                else if (item instanceof Element) {
                    el = item.getElement(X, Y);
                }

                if (el != null) {
                    element = el;
                    return false;
                }
            });
        }

        if (element == null) {
            element = this;
        }
    }
    return element;
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
Element.prototype.text = function() {
    var text = "";
    if (this.type == "none") {
        text = "";
    }
    else if (this.type == "number" || this.type == "char" || this.type == "chars" || this.type == "opchar") {
        text = this.children[0];
    }
    else if (this.type == "symbol") {
        text = "\\" + this.children[0].value;
    }
    else if (this.type == "opsymbol") {
        text = "\\" + this.children[0].value;
    }
    else if (this.type == "underover" || this.type == "subsup") {
        if (this.children[1].type == "opsymbol") {
            text = this.children[1].text() + this.children[0].text();
        }
        else {
            text = this.children[0].text();
            if (this.children[1].type != "none") {
                text += "_{" + this.children[1].text() + "}";
            }
            if (this.children[2].type != "none") {
                text += "^{" + this.children[2].text() + "}";
            }
        }
    }
    else if (this.type == "row") {
        text = "{";
        $.each(this.children, function(index, item) {
            text += item.text();
        });
        text += "}";
    }
    else if (this.type == "root") {
        text = "\\sqrt" + this.value.text();
    }
    else if (this.type == "frac") {
        text = "\\frac{" + this.children[0].text() + "}{" + this.children[1].text() + "}";
    }
    else if (this.type == "fenced") {

    }
    else if (this.type == "table") {

    }
    return text;
}
Element.prototype.update = function(X, Y, nestedSize) {
    if (nestedSize == null) {
        nestedSize = this.nestedSize;
    }

    if (this.type == "none") {
        this.x = X;
        this.y = Y - (nestedSize/2);
        this.width = nestedSize;
        this.height = nestedSize;
        this.nestedSize = nestedSize;
    }
    else if (this.type == "number" || this.type == "char" || this.type == "chars" || this.type == "opchar") {
        this.x = X;
        this.y = Y - (nestedSize/2);
        this.width = getTextWidth(this.children[0], nestedSize, (this.type == "char") ? "italic" : null);
        this.height = nestedSize;
        this.nestedSize = nestedSize;
    }
    else if (this.type == "symbol" || this.type == "opsymbol") {
        this.width = this.children[0].width;
        this.height = (this.type == "symbol") ? nestedSize : this.children[0].height;
        this.x = X;
        this.y = Y - (this.height/2);
        this.nestedSize = nestedSize;
    }

    else if (this.type == "subsup") {
        $.each(this.children, function(index, item) {
            item.update();
        });

        this.x = X;
        this.y = Y - (this.children[2].height) - (this.children[0].height/2);
        this.width = this.children[0].width + Math.max(this.children[1].width, this.children[2].width);
        this.height = this.children[0].height + this.children[1].height + this.children[2].height;
        this.nestedSize = nestedSize;

        this.children[0].update(X, Y);
        this.children[1].update(X + this.children[0].width, Y + ((this.children[0].height + this.children[1].height)/2));
        this.children[2].update(X + this.children[0].width, Y - ((this.children[0].height + this.children[2].height)/2));
    }
    else if (this.type == "underover") {
        $.each(this.children, function(index, item) {
            item.update();
        });

        this.x = X;
        this.y = Y - (this.children[2].height) - (this.children[0].height/2);
        this.width = Math.max(this.children[0].width, this.children[1].width, this.children[2].width);
        this.height = this.children[0].height + this.children[1].height + this.children[2].height;
        this.nestedSize = nestedSize;

        this.children[0].update(X + ((this.width - this.children[0].width)/2), Y);
        this.children[1].update(X + ((this.width - this.children[1].width)/2), Y + ((this.children[0].height + this.children[1].height)/2));
        this.children[2].update(X + ((this.width - this.children[2].width)/2), Y - ((this.children[0].height + this.children[2].height)/2));
    }


/*
    else if (jax.type == "texatom") {
        element = parseJax(jax.data[0], x, y, fontSize);
    }
    else if (jax.type == "mrow") {
        if (jax.data.length == 1) {
            element = parseJax(jax.data[0], x, y, fontSize);
        }
        else {
            element = new Element("row", null);
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
            element.x = x;
            element.y = y - (element.height/2);
        }
    }
    else if (jax.type == "msqrt" || jax.type == "mroot") {
        element = new Element("root", parseJax(jax.data[0], x + 10, y, fontSize));
        if (jax.data[1] != null) {
            element.children = parseJax(jax.data[1], x, y, fontSize);
        }
        element.width = element.value.width + 10;
        element.height = element.value.height;
        element.x = x;
        element.y = y - (element.height/2);
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
        element.width = width;
        element.height = height;
        element.x = x;
        element.y = y - (height/2);
    }
    else if (jax.type == "mfenced") {
        var el = parseJax(jax.data[0], null, null, fontSize);
        element = new Element("fenced", parseJax(jax.data[0], x + getTextWidth(jax.open, el.height), y - (el.height/3), fontSize));
        element.width = getTextWidth(jax.open, el.height) + element.value.width + getTextWidth(jax.close, el.height);
        element.height = el.height;
        element.x = x;
        element.y = y - (el.height/2);
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
        element.y = y - (rowHeights[0]/2);
        element.width = dx - x;
        element.height = dy - y + (rowHeights[rowHeights.length - 1]/2);
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
            el.y = y - (el.height/2);
            element.push(el);
            dx += el.width;
        });

        if (element.length == 1) {
            element = element[0];
        }
    }
    */
}


//TEST STRING: $$ abc12d3\alpha\pi     b_a^3 $$

function parseJax(jax, nestedSize) {
    //The object that gets returned
    var element = null;
    //If jax exists
    if (jax != null) {
        if (jax.type == "mn") {
            element = new Element("number", nestedSize);
            element.children.push(jax.data[0].data[0]);
        }
        else if (jax.type == "mi") {
            if (jax.data[0].type == "chars") {
                element = new Element((jax.data[0].data[0].length == 1) ? "char" : "chars", nestedSize);
                element.children.push(jax.data[0].data[0]);
            }
            else if (jax.data[0].type == "entity") {
                element = new Element("symbol", nestedSize);
                var img = new Image();
                img.src = "../images/" + entityConversion[jax.data[0].data[0]] + ".png";
                img.value = entityConversion[jax.data[0].data[0]];
                element.children.push(img);
            }
        }
        else if (jax.type == "mo") {
            if (jax.data[0].type == "chars") {
                element = new Element("opchar", nestedSize);
                element.children.push(jax.data[0].data[0]);
            }
            else if (jax.data[0].type == "entity") {
                element = new Element("opsymbol", nestedSize);
                var img = new Image();
                img.src = "../images/" + entityConversion[jax.data[0].data[0]] + ".png";
                img.value = entityConversion[jax.data[0].data[0]];
                element.children.push(img);
            }
        }

        else if (jax.type == "msubsup" || jax.type == "munderover") {
            element = new Element((jax.type == "msubsup") ? "subsup" : "underover", nestedSize);
            element.children.push(parseJax(jax.data[0], nestedSize));
            element.children.push(parseJax(jax.data[1], nestedSize*0.65));
            element.children.push(parseJax(jax.data[2], nestedSize*0.65));
        }




        else if (jax.type == "texatom") {
            element = parseJax(jax.data[0], nestedSize);
        }
        else if (jax.type == "mrow") {
            if (jax.data.length == 1) {
                element = parseJax(jax.data[0], nestedSize);
            }
            else {
                element = new Element("row", null);
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
                element.x = x;
                element.y = y - (element.height/2);
            }
        }
        else if (jax.type == "msqrt" || jax.type == "mroot") {
            element = new Element("root", parseJax(jax.data[0], x + 10, y, fontSize));
            if (jax.data[1] != null) {
                element.children = parseJax(jax.data[1], x, y, fontSize);
            }
            element.width = element.value.width + 10;
            element.height = element.value.height;
            element.x = x;
            element.y = y - (element.height/2);
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
            element.width = width;
            element.height = height;
            element.x = x;
            element.y = y - (height/2);
        }
        else if (jax.type == "mfenced") {
            var el = parseJax(jax.data[0], null, null, fontSize);
            element = new Element("fenced", parseJax(jax.data[0], x + getTextWidth(jax.open, el.height), y - (el.height/3), fontSize));
            element.width = getTextWidth(jax.open, el.height) + element.value.width + getTextWidth(jax.close, el.height);
            element.height = el.height;
            element.x = x;
            element.y = y - (el.height/2);
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
            element.y = y - (rowHeights[0]/2);
            element.width = dx - x;
            element.height = dy - y + (rowHeights[rowHeights.length - 1]/2);
        }



    ///////////////////TODO: Check if array really needed///////////////////

    }
    else {
        element = new Element("none", nestedSize);
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
    '#x2210': 'coprod',
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
    '#x2225': 'parallel',
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
    '#x2213': 'mp',
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
    '#x00B1': 'pm',
    '#x227A': 'Precedes',
    '#x2AAF': 'PrecedesEqual',
    '#x227C': 'PrecedesSlantEqual',
    '#x227E': 'PrecedesTilde',
    '#x220F': 'prod',
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
    '#x2243': 'simeq',
    '#x2245': 'TildeFullEqual',
    '#x2248': 'TildeTilde',
    '#x005F': 'UnderBar',
    '#x23DF': 'UnderBrace',
    '#x22C3': 'Union',
    '#x228E': 'UnionPlus',
    '#x2191': 'UpArrow',
    '#x2195': 'UpDownArrow',
    '#x22A5': 'perp',
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
    '#x22EF': 'cdots',
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
    '#x22F1': 'ddots',
    '#x2256': 'ecir',
    '#x2252': 'efDot',
    '#x2A96': 'egs',
    '#x2113': 'ell',
    '#x2A95': 'els',
    '#x2205': 'empty',
    '#x03B5': 'epsi',
    '#x03F5': 'epsilon',
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
    '#x03D5': 'phi',
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
    '#x03C5': 'upsilon',
    '#x21C8': 'upuparrows',
    '#x22BB': 'veebar',
    '#x22EE': 'vdots',
    '#x2118': 'weierp',
    '#x03BE': 'xi',
    '#x00A5': 'yen',
    '#x03B6': 'zeta',
    '#x21DD': 'zigrarr'
};
