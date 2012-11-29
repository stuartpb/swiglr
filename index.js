var fs = require('fs')
var gm = require('gm')
var jade = require('jade')
var stylus = require('stylus')
var opts = require('nomnom').options({
  source: {
    abbr: 'i',
    position: 0,
    help: 'Directory of images'
  },
  destination: {
    abbr: 'o',
    position: 1,
    help: 'Output directory'
  },
  thumbnails: {
    flag: true,
    default: true,
  },
  thumbnailWidth:{
    help: 'Size of thumbnails, in pixels',
    default: 150
  },
  title: {
    default: 'Gallery'
  },
  rows: {
    default: 4
  },
  columns:{
    default: 7
  }
}).parse()


var srcdir = opts.source
var destdir = opts.destination
var tsize = opts.thumbnailWidth
var galtitle = opts.title
var pagerows = opts.rows
var pagecols = opts.columns

//RUN.

function copyFile(src,dest) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
}
function cpDirToDir(name,src,dest){
  copyFile(src + '/' + name, dest + '/' + name)
}

function mkdirIfNotPresent(path) {
  if(!fs.statSync(path).isDirectory()){
    fs.mkdirSync(path)
  }
}

function reportErrOr(fn) {
  return function(err){
    if(err){
      console.error(err)
    } else {
      fn.apply(this,arguments)
    }
  }
}

var files = fs.readdirSync(srcdir)
var pageCount = Math.ceil(files.length / (pagerows * pagecols))
var rowCount = Math.ceil(files.length / pagecols)
var jt = jade.compile(
  fs.readFileSync(__dirname+'/galpage.jade'),
  {pretty: true})

mkdirIfNotPresent(destdir)

for (var i = 0; i < pageCount; ++i) {
  //Construct rows
  var rows = []
  var startingRow = pagerows * i
  var startingImg = pagecols * startingRow
  for(var iRow = 0; iRow < pagerows && startingRow + iRow < rowCount; ++iRow) {
    rows[iRow] = []
    for(var iCol = 0; iCol < pagecols && startingImg + iRow * pagecols + iCol < files.length; ++iCol) {
      var iImg = startingImg + iRow * pagecols + iCol
      rows[iRow][iCol] = {
        dest: files[iImg],
        thumb: 'thumbs/'+(iImg+1)+'.jpg'
      }
    }
  }
  var filename = destdir + '/'
  if (i == 0)
    filename += 'index.html'
  else
    filename += 'page' + (i+1) + '.html'

  fs.writeFileSync(filename, jt({
    pagetitle: galtitle + ' - Page ' + (i+1) + ' of ' + pageCount,
    rows: rows,
    pagenum: i,
    totalpages: pageCount
    }))
}

//Generate thumbnails
if(opts.thumbnails) {
  mkdirIfNotPresent(destdir+'/thumbs')
  
  function reportThumbing(orig, thumb) {
    return reportErrOr(function () {
      console.log(orig + ' => ' + thumb)
    })
  }
  
  for(var i = 0; i < files.length; ++i) {
    var destFilename = '/thumbs/' + (i+1) + '.jpg'
    gm(srcdir + '/' + files[i])
      .thumb(tsize, tsize, 63, 'middle', destdir + destFilename,
        reportThumbing(files[i], destFilename))
  }
}

//Generate stylesheet
stylus(fs.readFileSync(__dirname + '/galstyle.styl'))
  .define('twidth',tsize)
  .render(reportErrOr(function(css){
    fs.writeFileSync(destdir+"/galstyle.css",css)
  }))
