//-----Global Varialbes
//Canvas element and its context
var canvas, ctx;
//Width and height of the canvas
var canvasWidth, canvasHeight;
//Default font size
var fontSize = 16;

//Math elements array
var mathElements = new Array();

var hover = null;
var selected = null;
var selectedX = 0;
var selectedY = 0;
var selectedPos = 0;

var containerAcceptable = new Array("alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa", "lambda", "mu", "nu", "xi", "pi", "rho", "sigma", "tau", "upsilon", "phi", "chi", "psi", "omega",
    "infty", "neq", "cdots", "cdot", "times", "div", "perp", "parallel", "therefore", "because", "vdots", "ddots", "left", "right", "{", "}", "pm", "langle", "rangle", "|", "Gamma", "Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Phi", "Psi", "Omega");
var bigs = new Array("sum", "int", "prod", "iint", "coprod", "lim", "frac");
var bolds = new Array("sin", "cos", "tan", "ln", "e", "log");
var surroundable = new Array("\\left( \\right)", "\\left[ \\right]", "\\left| \\right|", "\\left\\{ \\right\\}", "\\left\\langle \\right\\rangle", "\\left\\| \\right\\|",
    "\\sqrt{ }", "\\left\\lfloor \\right\\rfloor", "\\left\\lceil \\right\\rceil", "\\ln( )", "e^{ }");

//Init function
$(window).load(function () {
    //Get the canvas and its context
    canvas = $("#equation_preview");
    ctx = canvas[0].getContext("2d");
    //Get the width and height of the canvas
    canvasWidth = canvas.width();
    canvasHeight = canvas.height();
    canvas.attr('width', canvasWidth + 'px').attr('height', canvasHeight + 'px');
    //Set the default font
    ctx.font = fontSize + 'px Cambria';
    //Set up the mouse and keyboard events
    canvas.on("mousemove", canvasMove).on("mousedown", canvasDown).on("contextmenu", canvasContextMenu).on("mouseup mouseout", canvasUp);
    $(document).on("keydown", keyDown);

    $("#buttons .smallbutton").draggable({
        cancel: "button",
        opacity: 0.7,
        revert: "invalid",
        helper: function () {
            return $(this).children("input").clone().appendTo("body").css("cursor", "none");
        },
        start: function (event, ui) {
            selected = null;
            for (var n in bigs) {
                if ($(this).children("input").val() == bigs[n]) {
                    selected = new BigElement(bigs[n].substr(1));
                    return;
                }
            }
            if (selected == null) {
                selected = new ContainerElement($(this).children("input").val());
            }
            selectedX = 0;
            selectedY = 0;
        }
    });

    $("#equation_preview").droppable({
        activeClass: "canvas-active",
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
        },
        out: function(event, ui) {
            mathElements.splice(selectedPos, 1);
            drawCanvas();

            $(ui.helper).show();
        }
    });

    var input = tinyMCE.activeEditor.selection.getContent();
    input= input.replace(/\&amp;/g,'&');
    if (input.indexOf('$$') == 0)
        input = input.substr(3);
    if (input.indexOf('$$') == input.length - 2)
        input = input.substr(0, input.length - 3);

    parseString(input);

    drawCanvas();

    //Make tabs AFTER doing image stuff
    $("#buttons").tabs({
        selected: 0
    });
});

function drawCanvas() {
    //Clear the canvas
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    //For each math element
    for (var n in mathElements) {
        mathElements[n].draw();

        //If the element is the currently selected element
        if (mathElements[n] == selected) {
            var rect = selected.getRect();
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

    //If an element is being hovered
    if (hover != null) {
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.strokeRect(hover.x, hover.y, hover.width, hover.height);
        ctx.restore();
    }
}

function addElement(element, index) {
    var x;
    var start;
    if (index != null && index >= 0 && mathElements.length > 0) {
        //Add the element at the index
        mathElements.splice(index, 0, element);

        //Get the starting x
        if (index > 0)
            x = mathElements[index - 1].x + mathElements[index - 1].width;
        else
            x = 10;
        start = index;
    }
    else {
        //Add the element to the end
        mathElements.push(element);

        //Set the starting x
        x = 10;
        start = 0;
    }

    for (var n = start; n < mathElements.length; n++) {
        mathElements[n].x = x;
        x += mathElements[n].width;
    }
    //Set the element's y
    element.y = (canvasHeight - element.height) / 2;

    drawCanvas();
}
function repositionElement(index) {
    var x;
    var start;
    if (index != null && index >= 0 && mathElements.length > 0) {
        if (index > 0)
            x = mathElements[index - 1].x + mathElements[index - 1].width;
        else
            x = 10;
        start = index;
    }
    else {
        x = 10;
        start = 0;
    }

    if (start >= mathElements.length) {
        drawCanvas();
        return;
    }

    //Reset the element's y
    mathElements[start].y = (canvasHeight - mathElements[start].height) / 2;
    for (var n = start; n < mathElements.length; n++) {
        mathElements[n].x = x;
        x += mathElements[n].width;
    }

    drawCanvas();
}

function addText(element) {
    var text = $(element).children().first().val();

    var newElement = null;
    for (var n in bigs) {
        if (text.substr(1) == bigs[n]) {
            newElement = new BigElement(bigs[n]);
            break;
        }
    }
    if (newElement == null) {
        newElement = new ContainerElement(text);
    }

    if (mathElements.length > 0) {
        var lastElement = mathElements[mathElements.length - 1];
        if (lastElement instanceof ContainerElement && newElement instanceof ContainerElement)
            lastElement.setText(lastElement.text + text);
        else
            addElement(newElement);
    }
    else {
        addElement(newElement);
    }

    drawCanvas();
}
function output() {
    var html = "$$ ";
    for (var n in mathElements) {
        html += mathElements[n].outputText();
    }
    html += " $$";

    return html;
}
function parseString(inputString) {
    //Search from one so we don't loop on non acceptable tags
    var slash = inputString.indexOf('\\');
    if (slash == -1)
        slash = inputString.length;

    if (slash == 0) {
        for (var n = 0; n < bigs.length; n++) {
            if (inputString.indexOf(bigs[n]) == 1) {
                var element = new BigElement(bigs[n]);

                if (inputString[bigs[n].length + 1] == "_" || inputString[bigs[n].length + 1] == "^") {
                    var pos = bigs[n].length + 2;
                    var openBr = 0;

                    do {
                        if (inputString[pos] == "{")
                            openBr++;
                        else if (inputString[pos] == "}")
                            openBr--;
                    }
                    while (openBr != 0 && ++pos < inputString.length);

                    element.sub.setText(inputString.substring(bigs[n].length + 2 + 1, pos));
                }

                addElement(element);

                return parseString(inputString.substr(1));
            }
        }
    }
    addElement(new ContainerElement(inputString));

    return null;
}

function canvasMove(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    hover = null;
    for (var n in mathElements) {
        if (mathElements[n].inBounds(x, y) && mathElements[n] != selected) {
            hover = mathElements[n].getElement(x, y);
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



    //mathElements.splice(n, 1);
    /*
     var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;

            for (var n in mathElements) {
                var thisElement = mathElements[n].getElement(x, y);

                if (thisElement != null) {
                    for (var m in surroundable) {
                        if ($(ui.helper).val() == surroundable[m]) {
                            var middle = surroundable[m].indexOf(" ");
                            var left = surroundable[m].substr(0, middle + 1);
                            var right = surroundable[m].substr(middle);
                            thisElement.setText(left + thisElement.text + right);
                            drawCanvas();
                            return;
                        }
                    }

                    for (var m in containerAcceptable) {
                        if ($(ui.helper).val() == '\\' + containerAcceptable[m]) {
                            thisElement.setText(thisElement.text + '\\' + containerAcceptable[m]);
                            drawCanvas();
                            return;
                        }
                    }
                    return;
                }
            }
            addElement(selected, selectedPos);
            drawCanvas();
         */
    }

    drawCanvas();

    return false;
}
function canvasDown(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    //Left mouse click
    if (event.which == 1) {
        selected = null;
        hover = null;
        for (var n in mathElements) {
            if (mathElements[n].inBounds(x, y)) {
                selected = mathElements[n];

                //Set selected offset and position
                selectedX = x - selected.x;
                selectedY = y - selected.y;
                selectedPos = n;

                drawCanvas();

                $(canvas).css("cursor", "move");
                //Return false so that the cursor stays as move
                return false;
            }
        }
    }
}
function canvasContextMenu(event) {
    //Get X and Y positions of the mouse relative to the canvas
    var x = event.pageX - canvas.offset().left;
    var y = event.pageY - canvas.offset().top;

    if (hover != null && hover instanceof ContainerElement) {
        var thisHover = hover;
        $("<input type='text' />").css({
            position: 'absolute',
            top: (canvas.offset().top + hover.y) + "px",
            left: (canvas.offset().left + hover.x) + "px",
            display: 'block',
            width: hover.textWidth,
            height: hover.textHeight,
            font: (fontSize*hover.scale) + 'px cambria',
            padding: '0px'
        }).on("keyup keypress update keydown", function(e) {
            thisHover.setText($(this).val());

            for (var m in mathElements) {
                if (mathElements[m] instanceof MatrixElement) {
                    mathElements[m].update();
                }
            }

            if (e.keyCode == 13) {
                $(this).remove();
                $(canvas).css("cursor", "default");
                repositionElement(0);
                return;
            }

            $(this).css("width", thisHover.textWidth + 6);

            drawCanvas();
        }).on("blur", function() {
            $(this).remove();
            $(canvas).css("cursor", "default");
            repositionElement(0);
            return false;
        }).val(thisHover.text).insertBefore(canvas).focus();
    }

    //Return false so normal context menu doesn't pop up
    return false;
}
function canvasUp(e) {
    //If there was something selected
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
    //If pressed delete key and an element is being hovered
    if (event.keyCode == 46 && hover != null) {
        for (var n in mathElements) {
            //If its the element that is being hovered
            if (mathElements[n] == hover) {
                //Remove that element
                mathElements.splice(n, 1);
                repositionElement(n);

                //Run canvasMove so that we update mouse hover
                selected = null;
                canvasMove(event);
                //Return false to prevent propagation
                return false;
            }
        }
    }
    //Otherwise, return true
    return true;
}

function addVector(braceType) {
    jPrompt('Number of rows:', 3, 'Vector', function(r1) {
        if(r1 != null) {
            addElement(new MatrixElement(r1, 1, braceType));
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
