# Copyright (c) 2018 Dustin Toff
# Licensed under Apache License v2.0

workspace(
    name = "fallingsand_dustindoff_com",
    managed_directories = {"@npm": ["node_modules"]},
)

load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

git_repository(
    name = "bazel_repository_toolbox",
    commit = "b7d32c04cb993267606a188cc4c55be3b6b5c564",
    remote = "https://github.com/quittle/bazel_repository_toolbox",
    shallow_since = "1593401847 +0100",
)

load("@bazel_repository_toolbox//:github_repository.bzl", "github_repository")

github_repository(
    name = "build_bazel_rules_nodejs",
    project = "rules_nodejs",
    sha256 = "e1a3b4f74619cfb2e357d1170312ba5105e6730d929db3c4053c7c3156847d99",
    tag = "1.7.0",
    user = "bazelbuild",
)

github_repository(
    name = "rules_web",
    commit = "73e6dd80535bb622aa69174613ae58a50b79fd9b",
    project = "rules_web",
    sha256 = "dd0f628a9a4d3acd43ea4cd426cd3d4fefd649dc4098e58b0f863c9d6ccea05d",
    user = "quittle",
)

load("@rules_web//:rules_web_deps_1.bzl", "rules_web_dependencies")

rules_web_dependencies()

load("@rules_web//:rules_web_deps_2.bzl", "rules_web_dependencies")

rules_web_dependencies()

load("@rules_web//:rules_web_deps_3.bzl", "rules_web_dependencies")

rules_web_dependencies()

load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "npm_install")

node_repositories(package_json = ["//:package.json"])

npm_install(
    name = "npm",
    package_json = "//:package.json",
    package_lock_json = "//:package-lock.json",
)

load("@npm//:install_bazel_dependencies.bzl", "install_bazel_dependencies")

install_bazel_dependencies()

load("@npm_bazel_typescript//:index.bzl", "ts_setup_workspace")

ts_setup_workspace()
