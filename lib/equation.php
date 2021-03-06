<?php
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

require_once('../../../../../../../../config.php');

$PAGE->set_context(get_context_instance(CONTEXT_SYSTEM));

$PAGE->set_pagelayout('embedded');

$PAGE->set_title('MathIllustrator');

$PAGE->requires->js(new moodle_url('../js/jquery-1.7.2.min.js'), true);
$PAGE->requires->js(new moodle_url('../js/jquery-ui-1.8.20.custom.min.js'), true);
$PAGE->requires->js(new moodle_url('../js/jquery.alerts.js'), true);
$PAGE->requires->js(new moodle_url('../js/jquery.contextMenu.js'), true);
$PAGE->requires->js(new moodle_url('../../../tiny_mce_popup.js'), true);
$PAGE->requires->js(new moodle_url('../js/html5_equation.js'), true);
//$PAGE->requires->js(new moodle_url('../js/MathJax/MathJax.js?config=TeX-AMS_HTML'), true);

$PAGE->requires->css(new moodle_url('../css/jquery-ui-1.8.20.custom.css'));
$PAGE->requires->css(new moodle_url('../css/jquery.alerts.css'));
$PAGE->requires->css(new moodle_url('../js/jquery.contextMenu.css'));
//style.css is included in editor_plugin.js
//$PAGE->requires->css(new moodle_url('../css/style.css'));

require_login();

echo $OUTPUT->header();

function smallButton($img, $value) {
    echo "<span class='smallbutton' onclick='addText(this);'><input type='image' src='../images/$img' value='$value' /></span>";
}

/**
 *
 * @param type $img
 * @param type $output
 * @return type
 */
function bigButton($img, $output) {
    echo "<span class='bigbutton' onclick='addText(this)'><input type='image' src='../images/$img' value='$output' /></span>";
}

/**
 *
 * @param type $img
 * @param type $matrixType
 */
function vectorButton($img, $matrixType) {
    echo "<span class='bigbutton' onclick='addVector(\"$matrixType\");'><input type='image' src='../images/$img' /></span>";
}

//TODO
function matrixButton($img, $braceType) {
    echo "<span class='bigbutton' onclick='addMatrix(\"$braceType\");'><input type='image' src='../images/$img' /></span>";
}
?>

<div id="buttons" style="text-align: left; font-size: 12px;">
    <ul>
        <li><a href="#HomeTab">Home</a></li>
        <li><a href="#OperatorsTab">Operators</a></li>
        <li><a href="#CalculusTab">Calculus</a></li>
        <li><a href="#GreekTab">Greek</a></li>
        <li><a href="#AlgebraTab">Algebra</a></li>
        <li><a href="#MiscellaneousTab">Miscellaneous</a></li>
    </ul>

    <div id="HomeTab">
        <table>
            <tr>
                <td><?php smallButton('comma.png', ','); ?></td>
                <td><?php smallButton('subscript.png', '{value}_{subscript}'); ?></td>
                <td><?php smallButton('superscript.png', '{value}^{superscript}'); ?></td>
                <td><?php smallButton('subsuperscript.png', '{value}_{subscript}^{superscript}'); ?></td>
                <td><?php smallButton('ln.png', '\ln{( )}'); ?></td>
                <td><?php smallButton('e.png', 'e^{ }'); ?></td>
                <td><?php smallButton('round_braces.png', '\left( \right)'); ?></td>
                <td><?php smallButton('square_braces.png', '\left[ \right]'); ?></td>
                <td><?php smallButton('abs_braces.png', '\left| \right|'); ?></td>
            </tr><tr>
                <td><?php smallButton('subsuperscriptleft.png', '_{subscript}^{superscript}\textrm{value}'); ?></td>
                <td><?php smallButton('frac.png', '\frac'); ?></td>
                <td><?php smallButton('vector.png', '\vec{variable}'); ?></td>
                <td><?php smallButton('unitvector.png', '\hat{variable}'); ?></td>
                <td><?php smallButton('log.png', '\log{( )}'); ?></td>
                <td><?php smallButton('logbase.png', '\log_{base}{(expression)}'); ?></td>
                <td><?php smallButton('curly_braces.png', '\left\{ \right\}'); ?></td>
                <td><?php smallButton('angle_braces.png', '\left\langle \right\rangle'); ?></td>
                <td><?php smallButton('length_braces.png', '\left\| \right\|'); ?></td>
            </tr>
        </table>
    </div>
    <div id="OperatorsTab">
        <table>
            <tr>
                <td><?php smallButton('plus.png', '+'); ?></td>
                <td><?php smallButton('minus.png', '-'); ?></td>
                <td><?php smallButton('times.png', '\times'); ?></td>
                <td><?php smallButton('div.png', '\div'); ?></td>
                <td><?php smallButton('cdot.png', '\cdot'); ?></td>
                <td><?php smallButton('pm.png', '\pm'); ?></td>
                <td><?php smallButton('equal.png', '='); ?></td>
                <td><?php smallButton('definition.png', ':='); ?></td>
                <td><?php smallButton('sqrt.png', '\sqrt{ }'); ?></td>
                <td><?php smallButton('ceil.png', '\left\lceil \right\rceil'); ?></td>
                <td rowspan="2"><?php bigButton('sum.png', '\sum'); ?></td>
                <td rowspan="2"><?php bigButton('prod.png', '\prod'); ?></td>
                <td rowspan="2"><?php bigButton('coprod.png', '\coprod'); ?></td>
            </tr><tr>
                <td><?php smallButton('le.png', '\le'); ?></td>
                <td><?php smallButton('lt.png', '\<'); ?></td>
                <td><?php smallButton('gt.png', '>'); ?></td>
                <td><?php smallButton('ge.png', '\ge'); ?></td>
                <td><?php smallButton('factorial.png', '!'); ?></td>
                <td><?php smallButton('mp.png', '\mp'); ?></td>
                <td><?php smallButton('neq.png', '\neq'); ?></td>
                <td><?php smallButton('simeq.png', '\simeq'); ?></td>
                <td><?php smallButton('sqrtpower.png', '\sqrt[{3}]{(*expression*)}'); ?></td>
                <td><?php smallButton('floor.png', '\left\lfloor \right\rfloor'); ?></td>
            </tr>
        </table>
    </div>
    <div id="CalculusTab">
        <table>
            <tr>
                <td rowspan="2"><?php bigButton('limit.png', '\lim'); ?></td>
                <td rowspan="2"><?php bigButton('derivative.png', '\der'); ?></td>
                <td rowspan="2"><?php bigButton('Integral.png', '\int'); ?></td>
            </tr>
        </table>
    </div>
    <div id="GreekTab">
        <table>
            <tr>
                <!-- Lower Case -->
                <td><?php smallButton('alpha.png', '\alpha'); ?></td>
                <td><?php smallButton('beta.png', '\beta'); ?></td>
                <td><?php smallButton('gamma.png', '\gamma'); ?></td>
                <td><?php smallButton('delta.png', '\delta'); ?></td>
                <td><?php smallButton('epsilon.png', '\epsilon'); ?></td>
                <td><?php smallButton('zeta.png', '\zeta'); ?></td>
                <td><?php smallButton('eta.png', '\eta'); ?></td>
                <td><?php smallButton('theta.png', '\theta'); ?></td>
                <td><?php smallButton('iota.png', '\iota'); ?></td>
                <td><?php smallButton('kappa.png', '\kappa'); ?></td>
                <td><?php smallButton('lambda.png', '\lambda'); ?></td>
                <td><?php smallButton('mu.png', '\mu'); ?></td>
                <td><?php smallButton('nu.png', '\nu'); ?></td>
                <td><?php smallButton('xi.png', '\xi'); ?></td>
                <td><?php smallButton('pi.png', '\pi'); ?></td>
                <td><?php smallButton('rho.png', '\rho'); ?></td>
                <td><?php smallButton('sigma.png', '\sigma'); ?></td>
                <td><?php smallButton('tau.png', '\tau'); ?></td>
                <td><?php smallButton('upsilon.png', '\upsilon'); ?></td>
                <td><?php smallButton('phi.png', '\phi'); ?></td>
                <td><?php smallButton('chi.png', '\chi'); ?></td>
                <td><?php smallButton('psi.png', '\psi'); ?></td>
                <td><?php smallButton('omega.png', '\omega'); ?></td>
            </tr><tr>
                <!-- Upper Case -->
                <td><?php smallButton('gamma_.png', '\Gamma '); ?></td>
                <td><?php smallButton('delta_.png', '\Delta '); ?></td>
                <td><?php smallButton('theta_.png', '\Theta '); ?></td>
                <td><?php smallButton('lambda_.png', '\Lambda '); ?></td>
                <td><?php smallButton('xi_.png', '\Xi '); ?></td>
                <td><?php smallButton('pi_.png', '\Pi '); ?></td>
                <td><?php smallButton('sigma_.png', '\Sigma'); ?></td>
                <td><?php smallButton('phi_.png', '\Phi '); ?></td>
                <td><?php smallButton('psi_.png', '\Psi '); ?></td>
                <td><?php smallButton('omega_.png', '\Omega '); ?></td>
            </tr>
        </table>
    </div>
    <div id="AlgebraTab">
        <table>
            <tr>
                <td><?php matrixButton('matrix1.png', 'round'); ?></td>
                <td><?php matrixButton('matrix2.png', 'square'); ?></td>
                <td><?php vectorButton('vector1.png', 'bmatrix'); ?></td>
                <td><?php vectorButton('vector2.png', 'square'); ?></td>
            </tr>
        </table>
    </div>
    <div id="MiscellaneousTab">
        <table>
            <tr>
                <td><?php smallButton('infty.png', '\infty'); ?></td>
                <td><?php smallButton('primes.png', '\mathbb{P}'); ?></td>
                <td><?php smallButton('naturals.png', '\mathbb{N}'); ?></td>
                <td><?php smallButton('integers.png', '\mathbb{Z}'); ?></td>
                <td><?php smallButton('irrationals.png', '\mathbb{I}'); ?></td>
                <td><?php smallButton('rationals.png', '\mathbb{Q}'); ?></td>
                <td><?php smallButton('reals.png', '\mathbb{R}'); ?></td>
                <td><?php smallButton('complex.png', '\mathbb{C}'); ?></td>
                <td><?php smallButton('perp.png', '\perp'); ?></td>
                <td><?php smallButton('parallel.png', '\parallel'); ?></td>
                <td><?php smallButton('therefore.png', '\therefore'); ?></td>
                <td><?php smallButton('because.png', '\because'); ?></td>
                <td><?php smallButton('cdots.png', '\cdots'); ?></td>
                <td><?php smallButton('vdots.png', '\vdots'); ?></td>
                <td><?php smallButton('ddots.png', '\ddots'); ?></td>
            </tr>
        </table>
    </div>
</div>
<br/>
<div style="text-align: center">
    <canvas id="equation_preview"></canvas><br/>
    <input id="TextEditor" type="text" style="display: none;"/><br/>
    <input type="button" onclick="tinyMCEPopup.execCommand('mceInsertContent', false, output()); tinyMCEPopup.close();" value="Insert"/>

    <ul id="conMenu" class="contextMenu">
        <li class="delete"><a href="#some">TEST</a></li>
    </ul>

    <p>
        Actual MathJax preview:<br/>



        <script type="text/javascript"
                src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_HTML">
        </script>

    <div id="MathOutput"></div>
    <div id="MathParser" style="display: none;"></div>
    <script>
        var inputText = tinyMCE.activeEditor.selection.getContent();
        if (inputText.indexOf("$$") >= 0 && (inputText.indexOf("$$", inputText.indexOf("$$") + 1)) >= 0) {
            $("#MathParser").html(tinyMCE.activeEditor.selection.getContent());
        }
        else {
            $("#MathParser").html("$$ $$");
        }

        $("#MathOutput").html(tinyMCE.activeEditor.selection.getContent());
        //  Use a closure to hide the local variables from the global namespace
        (function () {
            var QUEUE = MathJax.Hub.queue;  // shorthand for the queue
            var math = null;                // the element jax for the math output.

            //  Get the element jax when MathJax has produced it.
            QUEUE.Push(function () {
                math = MathJax.Hub.getAllJax("MathParser")[0];
            });

            //  he onchange event handler that typesets the math entered by the user
            window.UpdateMath = function(TeX) {
                QUEUE.Push(["Text", math, TeX]);
            }
        })();
    </script>
</p>
</div>
