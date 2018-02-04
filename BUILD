# Copyright (c) 2018 Dustin Toff
# Licensed under Apache License v2.0

load("@rules_web//html:html.bzl",
    "html_page",
    "minify_html",
)

load("@rules_web//images:images.bzl",
    "minify_png",
)

load("@rules_web//js:js.bzl",
    "closure_compile",
    "resource_map",
)

load("@rules_web//images:images.bzl",
    "minify_png",
)

load("@rules_web//site_zip:site_zip.bzl",
    "rename_zip_paths",
    "zip_server",
    "zip_site",
)

load("@rules_web//deploy:deploy.bzl",
    "deploy_site_zip_s3_script",
)

minify_png(
    name = "droplet_png",
    png = "Grow/images/droplet.png",
)

minify_png(
    name = "fire_png",
    png = "Grow/images/fire.png",
)

minify_png(
    name = "gen_png",
    png = "Grow/images/gen.png",
)

minify_png(
    name = "growth_png",
    png = "Grow/images/growth.png",
)

minify_png(
    name = "steam_png",
    png = "Grow/images/steam.png",
)

minify_png(
    name = "wall_png",
    png = "Grow/images/wall.png",
)

filegroup(
    name = "worlds",
    srcs = [
        "Grow/boring.grw",
        "Grow/world3.grw",
        "Grow/world4.grw",
    ],
)

resource_map(
    name = "fallingsand_resource_map",
    constant_name = "RESOURCE_PATHS",
    deps = [
        ":droplet_png",
        ":fire_png",
        ":gen_png",
        ":growth_png",
        ":steam_png",
        ":wall_png",
        ":worlds",
    ],
)

closure_compile(
    name = "fallingsand_js",
    srcs = [
        ":fallingsand_resource_map",
        "grow.js",
    ],
    compilation_level = "ADVANCED",
    #warning_level = "QUIET",
    #extra_args = [ "--jscomp_off", "checkVars" ],
)

html_page(
    name = "index_html",
    body = "index.html",
    config = "index_config.json",
    deferred_js_files = [
        ":fallingsand_js",
        #":grow.js",
    ],
    deps = [
        ":droplet_png",
        ":fire_png",
        ":gen_png",
        ":growth_png",
        ":steam_png",
        ":wall_png",
        ":worlds",
    ],
)

minify_html(
    name = "min_index_html",
    src = ":index_html",
    visibility = [ "//visibility:public" ],
)

zip_site(
    name = "fallingsand_dustintoff_com",
    root_files = [
        ":min_index_html",
    ],
    out_zip = "fallingsand_dustintoff_com.zip",
)

rename_zip_paths(
    name = "rename_fallingsand_dustintoff_com_zip",
    source_zip = ":fallingsand_dustintoff_com",
    path_map = {
        ":min_index_html": "index.html",
    },
)

alias(
    name = "final_zip",
    actual = ":rename_fallingsand_dustintoff_com_zip",
)

zip_server(
    name = "zip_server",
    zip = ":final_zip",
    port = 8080,
)

deploy_site_zip_s3_script(
    name = "deploy_site",
    bucket = "fallingsand.dustintoff.com",
    zip_file = ":final_zip",
    cache_durations = {
        60 * 15: [ "*" ],
    },
    content_types = {
        "grw": "text/xml",
    },
)
