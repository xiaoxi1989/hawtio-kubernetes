/// <reference path="../../includes.ts"/>
module Developer {

  export var context = '/workspaces';
  export var hash = '#' + context;
  export var pluginName = 'Developer';
  export var pluginPath = 'plugins/developer/';
  export var templatePath = pluginPath + 'html/';
  export var log:Logging.Logger = Logger.get(pluginName);

  export var jenkinsServiceName = "jenkins";
  export var jenkinsServiceNameAndPort = jenkinsServiceName + ":http";

  export var jenkinsHttpConfig = {
    headers: {
      Accept: "application/json, text/x-json, text/plain"
    }
  };

  /**
   * Returns true if the value hasn't changed from the last cached JSON version of this object
   */
  export function hasObjectChanged(value, state) {
    var json = angular.toJson(value || "");
    var oldJson = state.json;
    state.json = json;
    return !oldJson || json !== oldJson;
  }

  export function projectForScope($scope) {
    if ($scope) {
      return $scope.buildConfig || $scope.entity || ($scope.model || {}).project;
    }
    return null;
  }
  /**
   * Lets load the project versions for the given namespace
   */
  export function loadProjectVersions($scope, $element, project, env, ns, answer, caches) {
    var projectAnnotation = "project";
    var versionAnnotation = "version";
    var watchedNsNames = {};
    Kubernetes.watch($scope, $element, "replicationcontrollers", ns, (data) => {
        if (data) {
          var projectInfos = {};
          var projectNamespace = project.$namespace;
          var projectName = project.$name;

          //env.projectVersions = projectInfos;
          angular.forEach(data, (item) => {
            var metadata = item.metadata || {};
            var name = metadata.name;
            var labels = metadata.labels || {};
            var annotations = metadata.annotations || {};

            var project = labels[projectAnnotation];
            var version = labels[versionAnnotation];
            if (project && version) {
              var projects = projectInfos[project];
              if (!projects) {
                projects = {
                  project: project,
                  versions: {}
                };
                projectInfos[project] = projects;
              }
              var versionInfo = projects.versions[version];
              if (!versionInfo) {
                versionInfo = {
                  replicationControllers: []
                };
                projects.versions[version] = versionInfo;
              }
              versionInfo.replicationControllers.push(item);
            }
            if (name) {
              item.$name = name;
              if (projectNamespace && projectName) {
                item.$viewLink = UrlHelpers.join("/workspaces/", projectNamespace, "projects", projectName, "namespace", ns, "replicationControllers", name);
              }
            }
            item.$buildId = annotations["fabric8.io/build-id"];
            item.$buildUrl = annotations["fabric8.io/build-url"];
            item.$gitCommit = annotations["fabric8.io/git-commit"];
            item.$gitUrl = annotations["fabric8.io/git-url"];
            item.$gitBranch = annotations["fabric8.io/git-branch"];

            var spec = item.spec || {};
            var selector = spec.selector;
            if (selector) {
              if (!watchedNsNames[name]) {
                watchedNsNames[name] = true;
                loadProjectPodCounters($scope, $element, project, item, selector, ns, projectName);
              }
            }
          });

          var cache = caches[ns];
          if (!cache) {
            cache = {};
            caches[ns] = cache;
          }
          if (hasObjectChanged(projectInfos, cache)) {
            log.info("project versions has changed!");
            answer[ns] = projectInfos;
          }
        }
      });
  }

  function loadProjectPodCounters($scope, $element, project, rc, selector, ns, projectName) {
    var selectorText = Kubernetes.labelsToString(selector, ",");
    var podLinkUrl = UrlHelpers.join(projectLink(projectName), "namespace", ns, "pods");

    Kubernetes.watch($scope, $element, "pods", ns, (data) => {
        if (data) {
          var pods = data;
          if (pods) {
            rc.pods = [];
            rc.$podCounters = Kubernetes.createPodCounters(selector, pods, rc.pods, selectorText, podLinkUrl);
          }
        }
      }, selector);
  }

}