<html>
<head>
  <meta charset="utf-8">
  <title>Proximité entre députés auteurs d'amendements identiques ou cosignés sur un texte donné</title>
  <link rel="stylesheet" href="css/bootstrap.min.css">
  <link rel="stylesheet" href="css/style.css">
  <script type="text/javascript" charset="utf-8" src="js/jquery-1.8.2.min.js"></script>
  <script type="text/javascript" charset="utf-8" src="js/sigma.min.js"></script>
  <script type="text/javascript" charset="utf-8" src="js/sigma.layout.forceAtlas2.min.js"></script>
  <script type="text/javascript" charset="utf-8" src="js/sigma.plugins.animate.min.js"></script>
  <script type="text/javascript" charset="utf-8" src="js/amendements.js"></script>
</head>
<body>
  <div class="container">
    <div class="row">
      <h1>Proximité entre députés auteurs d'amendements identiques ou cosignés sur un texte donné</h1>
      <div class="buttons-container">Choisir un texte :
        <select name="loi" id="loi">
<?php foreach (array("707","1005","1006","1108","1109","1473","1551","71","84","86","107","130","136","145","148","199","200","222","235","237","244","245","246","285","287","332","334","345","403","409","410","414","415","424","433","434","463","466","470","490","541","543","549","566","570","579","628","650","654","700","701","707","725","1329") as $loi) echo "<option>".$loi."</option>"; ?>
        </select>
        <span id="loader"><img src="css/ajax-loader.gif" alt="loader" title="loader"/></span>
        <span id="menu">Basculer vers la vue <button class="hemicycle" id="layout">Cosignatures</button></span>
      </div>
      <div id="sigma-parent">
        <div id="sigma"></div>
        <div class="sigma-tools">
          <div class="btn-group-vertical">
            <button type="button" id="recenter" class="btn btn-link btn-xs"><span class="glyphicon glyphicon-record"></span></button>
            <button type="button" id="zoom" class="btn btn-link btn-xs"><span class="glyphicon glyphicon-plus"></span></button>
            <button type="button" id="unzoom" class="btn btn-link btn-xs"><span class="glyphicon glyphicon-minus"></span></button>
          </div>
        </div>
      </div>
      <div class="disclaimer"><p>Cliquer sur un député pour voir ses liens avec les autres députés</p></div>
      <div class="disclaimer"><p><small>Réalisé à partir des données de <a href="http://www.nosdeputes.fr">NosDéputés.fr</a> grâce à <a href="http://www.sigmajs.org">sigma.js</a> &mdash; <a href="https://github.com/regardscitoyens/the-law-factory/tree/master/public/tmp/amendements">code-source</a></small></p></div>
    </div>
  </div>
</body>
</html>
