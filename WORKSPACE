# Copyright (c) 2018 Dustin Toff
# Licensed under Apache License v2.0

workspace(name = "fallingsand_dustindoff_com")

git_repository(
    name = "bazel_repository_toolbox",
    remote = "https://github.com/quittle/bazel_repository_toolbox.git",
    commit = "dfffafc08ec40df1b5ef1fbe0fbe77e643f6c672",
)

load("@bazel_repository_toolbox//:github_repository.bzl", "github_repository")

github_repository(
    name = "rules_web",
    user = "quittle",
    project = "rules_web",
    commit = "a45f5a194b8830cc2deea0a056285f780fd29eb3",
    sha256 = "170bbd2ccf7310f08c3bdc0ca59285b05ec989458ca307fa32d545063be3bfd9",
)

load("@rules_web//:rules_web_repositories.bzl", "rules_web_repositories")
rules_web_repositories()

github_repository(
    name = "build_bazel_rules_nodejs",
    user = "bazelbuild",
    project = "rules_nodejs",
    tag = "0.4.1",
    sha256 = "7908b393219be6e40b06a726b72d6e8969202d1ba436a1bbd142be6038f8541d",
)
load("@build_bazel_rules_nodejs//:defs.bzl", "node_repositories")
node_repositories(package_json = ["//:package.json"])

github_repository(
    name = "build_bazel_rules_typescript",
    user = "bazelbuild",
    project = "rules_typescript",
    tag = "0.10.1",
    sha256 = "aa2dc2e4e74e642a0009e3d68c1ba33eb75cdb2a17623f338071f8bc1be09d88",
)
load("@build_bazel_rules_typescript//:defs.bzl", "ts_setup_workspace")
ts_setup_workspace()
