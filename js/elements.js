function ContainerElement(text, scale, parent) {
    this.x = null;
    this.y = null;

    this.width = null;
    this.height = null;

    this.elements = null;
    this.widths = null;
    this.heights = null;
    this.displace = null;

    if (scale == null)
        this.scale = 1;
    else
        this.scale = scale;

    this.text = null;
    this.textWidth = null;
    this.textHeight = null;

    this.setText(text);

    this.parent = parent;
}
ContainerElement.prototype.draw = function() {
    if (this.text == "")
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    else {
        var x = 0;
        for (var n in this.elements) {
            if (this.elements[n] instanceof Image) {
                ctx.drawImage(this.elements[n], this.x + x, this.y + ((this.height - this.heights[n]) / 2),
                    this.widths[n]*this.scale*Math.pow(0.75, this.displace[n]), this.heights[n]*this.scale*Math.pow(0.75, this.displace[n]));
            }
            else {
                ctx.save();
                ctx.font = (fontSize*this.scale*Math.pow(0.75, this.displace[n])) + "px Cambria";

                var dy = -this.displace[n] * 8;

                ctx.fillText(this.elements[n], this.x + x, this.y + 1.25*this.height - 0.5*this.heights[n] + dy);
                ctx.restore();
            }
            x += this.widths[n];
        }
    }
}
ContainerElement.prototype.parseText = function(text) {
    //Recursive exit condition
    if (text == "")
        return null;

    if (text[0] == '\\') {
        for (var n in containerAcceptable) {
            if (text.indexOf(containerAcceptable[n]) == 1) {
                if (containerAcceptable[n] == "left" || containerAcceptable[n] == "right") {
                    return this.parseText(text.substr(containerAcceptable[n].length + 1));
                }
                else if (containerAcceptable[n] == "{" || containerAcceptable[n] == "}") {
                    return this.parseText(text.substr(1));
                }
                else if (containerAcceptable[n] == "|") {
                    return this.parseText("||" + text.substr(2));
                }
                else if (containerAcceptable[n] == "langle") {
                    return this.parseText("<" + text.substr(7));
                }
                else if (containerAcceptable[n] == "rangle") {
                    return this.parseText(">" + text.substr(7));
                }

                var img = new Image();
                if (containerAcceptable[n][0] !== containerAcceptable[n][0].toUpperCase())
                    img.src = '../images/' + containerAcceptable[n] + '.png';
                else
                    img.src = '../images/' + containerAcceptable[n] + '_.png';

                this.elements.push(img);
                this.widths.push(img.width*this.scale);
                this.heights.push(img.height*this.scale);
                this.displace.push(0);

                return this.parseText(text.substr(containerAcceptable[n].length + 1));
            }
        }
    }
    else if (text[0] == '^') {
        ctx.save();
        ctx.font = '13px Cambria Math'

        if (text[1] == "{") {
            var end = text.indexOf('}', 2);
            if (end == -1)
                end = text.length;

            var nextIndex = this.elements.length;
            this.parseText(text.substring(2, end));
            for (var n = nextIndex; n < this.elements.length; n++) {
                this.displace[n]++;
            //this.widths[n]*=0.5;
            }
            text = " " + text.substr(end + 1);
        }
        else if (text[1] == '\\') {
            for (var n = 0; n < containerAcceptable.length; n++) {
                if (text.indexOf(containerAcceptable[n]) == 2) {
                    var nextIndex = this.elements.length;
                    this.parseText(text.substr(1, containerAcceptable[n].length + 1));
                    for (var n = nextIndex; n < this.elements.length; n++) {
                        this.displace[n]++;
                    }
                    text = text.substr(2 + containerAcceptable[n].length);
                }
            }
        }
        else {
            var nextIndex = this.elements.length;
            this.parseText(text.substr(1, 1));
            for (var n = nextIndex; n < this.elements.length; n++) {
                this.displace[n]++;
            }
            text = text.substr(2);
        }
        ctx.restore();
    }

    //Search from one so we don't loop on non acceptable tags
    var slash = text.indexOf('\\', 1);
    if (slash == -1)
        slash = text.length;
    var hat = text.indexOf('^', 1);
    if (hat == -1)
        hat = text.length;
    var underscore = text.indexOf('_', 1);
    if (underscore == -1)
        underscore = text.length;
    var leftBrace = text.indexOf('{', 1);
    if (leftBrace == -1)
        leftBrace = text.length;

    var first = Math.min(slash, hat, underscore, leftBrace);

    if (first != 0) {
        this.elements.push(text.substr(0, first).replace(/\ /g, ""));
        this.widths.push(getTextWidthHeight(text.substr(0, first).replace(/\ /g, ""), fontSize*this.scale)[0]);
        this.heights.push(getTextWidthHeight(text.substr(0, first).replace(/\ /g, ""), fontSize*this.scale)[1]);
        this.displace.push(0);
    }

    return this.parseText(text.substr(first));
}
ContainerElement.prototype.getElement = function(canvasX, canvasY) {
    return this;
}
ContainerElement.prototype.getRect = function(canvasX, canvasY) {
    return [this.x, this.y, this.width, this.height];
}
ContainerElement.prototype.inBounds = function(canvasX, canvasY) {
    if (canvasX > this.x && canvasX < this.x + this.width
        && canvasY > this.y && canvasY < this.y + this.height)
        return true;
    else
        return false;
}
ContainerElement.prototype.outputText = function() {
    return this.text;
}
ContainerElement.prototype.setText = function(text) {
    this.elements = new Array();
    this.widths = new Array();
    this.heights = new Array();
    this.displace = new Array();

    if (text == null || text == "") {
        this.text = "";

        this.width = 15;
        this.height = 15;

        this.textWidth = 15;
        this.textHeight = 15;
    }
    else {
        this.text = text;

        var size = getTextWidthHeight(text, fontSize*this.scale);
        this.textWidth = size[0];
        this.textHeight = size[1];

        this.parseText(text);

        this.width = 0;
        this.height = 0;
        for (var n = 0; n < this.elements.length; n++) {
            this.width += this.widths[n];
            this.height = Math.max(this.height, this.heights[n]);
        }
    }
    if (this.parent != undefined) {
        this.parent.update();
    }
}
////////////////////////////////////////////////////////////////////////////////
function MatrixElement(matrixI, matrixJ, type) {
    this.i = matrixI;
    this.j = matrixJ;

    this.style = null;
    switch (type) {
        case 'curly':
            this.style = ['{', '}'];
            break;
        case 'square':
            this.style = ['[', ']'];
            break;
        case 'abs':
            this.style = ['|', '|'];
            break;
        default:
            this.style = ['(', ')'];
            break;
    }
    this.styleWidth = ctx.measureText(this.style[0]).width;

    this.values = new Array();
    this.maxColWidth = new Array();
    for (var j = 0; j < this.j; j++) {
        this.maxColWidth[j] = 0;
    }

    for (var i = 0; i < matrixI; i++) {
        var row = new Array();
        for (var j = 0; j < matrixJ; j++) {
            var temp = new ContainerElement(null, 0.8);
            temp.x = this.x + this.styleWidth + 20*j;
            temp.y =  this.y + 20*i;
            row.push(temp);

            this.maxColWidth[j] = Math.max(temp.width, this.maxColWidth[j]);
        }
        this.values.push(row);
    }

    this.height = this.i * 20;
    this.width = this.styleWidth * 2 + 10;
    for (var j = 0; j < this.j; j++) {
        this.width += this.maxColWidth[j] + 10;
    }

    this.x = 0;
    for (var n in mathElements) {
        this.x += mathElements[n].width;
    }
    this.y = (canvasHeight - this.height) / 2;
}
MatrixElement.prototype.draw = function () {
    var x = this.x;
    var y = this.y + (this.height + 12) / 2;

    ctx.fillText(this.style[0], x, y);

    x += this.styleWidth + 10;

    ctx.save();
    ctx.font = '12px Cambria Math';
    for (var j = 0; j < this.j; j++) {
        for (var i = 0; i < this.i; i++) {
            var dx = (this.maxColWidth[j] - this.values[i][j].width) / 2;

            this.values[i][j].x = x + dx;
            this.values[i][j].y = this.y + 20*i;
            this.values[i][j].draw();
        }
        x += this.maxColWidth[j] + 10;
    }
    ctx.restore();

    ctx.fillText(this.style[1], x, y);
}
MatrixElement.prototype.getElement = function (canvasX, canvasY) {
    var x = canvasX - this.x;
    var y = canvasY - this.y;

    if ((x > 0 && x < this.styleWidth + 10
        && y > 0 && y < this.height)
    || (x > this.width - this.styleWidth - 10 && x < this.width
        && y > 0 && y < this.height))
        return this;

    x = canvasX - (this.x + this.styleWidth + 10);

    for (var i = 0; i < this.i; i++) {
        for (var j = 0; j < this.j; j++) {
            if (this.values[i][j].inBounds(canvasX, canvasY))
                return this.values[i][j];
        }
    }

    return null;
}
MatrixElement.prototype.getRect = function(canvasX, canvasY) {
    var x = canvasX - this.x;
    var y = canvasY - this.y;

    if ((x > 0 && x < this.styleWidth + 10
        && y > 0 && y < this.height)
    || (x > this.width - this.styleWidth - 10 && x < this.width
        && y > 0 && y < this.height))
        return this.rect();

    x = canvasX - (this.x + this.styleWidth + 10);

    for (var i = 0; i < this.i; i++) {
        for (var j = 0; j < this.j; j++) {
            if (this.values[i][j].inBounds(canvasX, canvasY))
                return this.values[i][j].rect();
        }
    }

    return this.rect();
}
MatrixElement.prototype.outputText = function() {
    var matrixType;
    switch (this.style[0]) {
        case '[':
            matrixType = 'bmatrix';
            break;
        case '|':
            matrixType = 'vmatrix';
            break;
        default:
            matrixType = 'pmatrix';
            break;
    }

    var tex = "\\begin{" + matrixType + "} ";

    for (var i = 0; i < this.i; i++) {
        for (var j = 0; j < this.j; j++) {
            tex += this.values[i][j].text + " & ";
        }
        tex = tex.slice(0, -3);
        tex += " \\\\ ";
    }
    tex = tex.slice(0, -3);
    tex += "\\end{" + matrixType + "}";

    return tex;
}
MatrixElement.prototype.inBounds = function (canvasX, canvasY) {
    if (canvasX > this.x && canvasX < this.x + this.width
        && canvasY > this.y && canvasY < this.y + this.height)
        return true;
    else
        return false;
}
MatrixElement.prototype.rect = function() {
    return [this.x, this.y, this.width, this.height];
}
MatrixElement.prototype.update = function () {

    this.maxColWidth = new Array();
    for (var j = 0; j < this.j; j++) {
        this.maxColWidth[j] = 0;
    }

    for (var i = 0; i < this.i; i++) {
        for (var j = 0; j < this.j; j++) {
            this.maxColWidth[j] = Math.max(this.values[i][j].width, this.maxColWidth[j]);
        }
    }

    this.height = this.i * 20;
    this.width = this.styleWidth * 2 + 10;
    for (var j = 0; j < this.j; j++) {
        this.width += this.maxColWidth[j] + 10;
    }

    this.y = (canvasHeight - this.height) / 2;
}
////////////////////////////////////////////////////////////////////////////////
function BigElement(type, sub, sup, eq) {
    this.x = null;
    this.y = null;

    this.width = null;
    this.height = null;

    this.type = type;

    this.scale = 1;

    //Type can be sum, int, iint, iiint, coprod, prod
    this.img = new Image();
    for (var n = 0; n < bigs.length; n++) {
        if (type == bigs[n]) {
            this.img.src = '../images/' + bigs[n] + '.png';
            break;
        }
    }

    this.eq = new ContainerElement("", null, this);
    this.sub = new ContainerElement("", 0.75, this);
    this.sup = new ContainerElement("", 0.75, this);

    this.update();
}
BigElement.prototype.update = function() {
    this.width = Math.max(this.img.width, this.sub.width, this.sup.width) + this.eq.width;
    this.height = this.img.height + this.sub.height + this.sup.height;
    if (this.type == 'frac') {
        this.height += 5;
    }
}
BigElement.prototype.draw = function() {
    if (this.type == 'frac') {
        var x = this.x + (this.width/2);

        //ctx.drawImage(this.img, x, this.y + this.sup.height);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + (this.height/2));
        ctx.lineTo(this.x + this.width, this.y + (this.height/2));
        ctx.closePath();
        ctx.stroke();

        this.sub.x = x - (this.sub.width/2);
        this.sub.y = this.y + this.height - this.sup.height;
        this.sub.draw();

        this.sup.x = x - (this.sup.width/ 2);
        this.sup.y = this.y;
        this.sup.draw();
    }
    else {
        var x = this.x + ((this.width - this.eq.width - this.img.width)/2);

        ctx.drawImage(this.img, x, this.y + this.sup.height);

        this.eq.x = this.x + (this.width - this.eq.width);
        this.eq.y = this.y + ((this.img.height - this.eq.height) / 2 + this.sup.height);
        this.eq.draw();

        this.sub.x = x - ((this.sub.width - this.img.width)/2);
        this.sub.y = this.y + this.img.height + this.sup.height;
        this.sub.draw();

        this.sup.x = x - ((this.sup.width - this.img.width) / 2);
        this.sup.y = this.y;
        this.sup.draw();
    }
}
BigElement.prototype.inBounds = function(canvasX, canvasY) {
    if (canvasX > this.x && canvasX < this.x + this.width
        && canvasY > this.y && canvasY < this.y + this.height)
        return true;
    else
        return false;
}
BigElement.prototype.getRect = function(canvasX, canvasY) {
    if (this.eq.inBounds(canvasX, canvasY))
        return this.eq.getRect();
    else if (this.sub.inBounds(canvasX, canvasY))
        return this.sub.getRect();
    else if (this.sup.inBounds(canvasX, canvasY))
        return this.sup.getRect();
    else
        return [this.x, this.y, this.width, this.height];
}
BigElement.prototype.getElement = function(canvasX, canvasY) {
    if (this.eq.inBounds(canvasX, canvasY))
        return this.eq;
    else if (this.sub.inBounds(canvasX, canvasY))
        return this.sub;
    else if (this.sup.inBounds(canvasX, canvasY))
        return this.sup;
    else
        return this;
}
BigElement.prototype.setText = function(text) {
    this.text = text;
    if (text == null) {
        this.eq.setText("");
        this.sub.setText("");
        this.sup.setText("");
    }
    else {
        text = text.substr(1 + this.type.length);

        while (text != "") {
            var sub = text.indexOf('_');
            if (sub == -1)
                sub = text.length;
            var sup = text.indexOf('^');
            if (sup == -1)
                sup = text.length;
            var bracket = text.indexOf('{');
            if (bracket == -1)
                bracket = text.length;

            var first = Math.min(sub, sup, bracket);

            if (first == bracket) {

            }
            else if (first == sub) {
                if (text[sub + 1] == '{') {
                    var end = text.indexOf('}');
                    if (end == -1)
                        end = text.length;

                    this.sub.setText(text.substring(sub + 2, end));
                }
                else {
                    this.sub.setText(text[sub + 1])
                }
            }
        }
    }
}
BigElement.prototype.outputText = function() {
    if (this.type == 'frac') {
        return '\\' + this.type + '{' + this.sup.outputText() + '}{' + this.sub.outputText() + '}';
    }
    return '\\' + this.type + '_{' + this.sub.outputText() + '}^{' + this.sup.outputText() + '}{' + this.eq.outputText() + '}';
}
////////////////////////////////////////////////////////////////////////////////






