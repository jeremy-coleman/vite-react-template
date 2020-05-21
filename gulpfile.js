var ForwardRegistry = require("undertaker-forward-reference");
var gulp = require("gulp");
gulp.registry(new ForwardRegistry());
var cp = require("child_process");
var path = require("path");
var concat = require("gulp-concat")

var tsc = require("gulp-typescript").createProject("./tsconfig.json", {
  isolatedModules: true,
});

var babel = require("gulp-babel");

const spawnBin = (binCommand, args) => {
  const getCommandPath = (binCommand) => {
    const cmd = process.platform === "win32" ? `${binCommand}.cmd` : binCommand;
    return path.resolve(__dirname, "node_modules", ".bin", cmd);
  };

  return cp.spawn(getCommandPath(binCommand), args, {
    cwd: path.resolve(__dirname),
    //['pipe', terminalStream, process.stderr]
    stdio: "inherit",
  });
};

gulp.task("tsc", () => {
  return gulp
    .src("src/**/*.{ts,tsx,js,jsx}")
    .pipe(tsc())
    .pipe(babel())
    .pipe(gulp.dest("app"));
});


gulp.task("copy", () => {
  return gulp
    .src(["src/**/*", "!src/**/*.{ts,tsx,js,jsx}", "!src/**/*/tsconfig.json"])
    .pipe(gulp.dest("app"));
});

gulp.task("watch", async function () {
  gulp.watch(["src/**/*", "!src/**/*.{ts,tsx,js,jsx}"], gulp.series("copy"));
  gulp.watch(["src/**/*.{ts,tsx,js,jsx}"], gulp.series("tsc"));
});

gulp.task("vite", async function () {
  spawnBin("vite", ["serve", "app"]);
});

gulp.task("typecheck", async function () {
  spawnBin("tsc", ["-p", "tsconfig.json", "--noEmit", "--watch"]);
});

gulp.task("start", gulp.series(gulp.tree().nodes));

// gulp.task('start', gulp.series(
//   gulp.parallel('copy', 'tsc'),
//   gulp.parallel("watch","vite")
// ))


gulp.task("cat", () => {
  return gulp
    .src("node-iaktta/src/**/*.{ts,tsx,js,jsx}")
    .pipe(concat("m-hook.ts"))
    //.pipe(babel())
    .pipe(gulp.dest("temp"));
});