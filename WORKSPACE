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
