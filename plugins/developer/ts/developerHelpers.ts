/// <reference path="../../includes.ts"/>
module Developer {

  export var context = '/workspaces';
  export var hash = '#' + context;
  export var pluginName = 'Developer';
  export var pluginPath = 'plugins/developer/';
  export var templatePath = pluginPath + 'html/';
  export var log:Logging.Logger = Logger.get(pluginName);


  export function enrichWorkspaces(projects) {
    angular.forEach(projects, (project) => {
      enrichWorkspace(project);
    });
    return projects;
  }

  export function enrichWorkspace(build) {
    if (build) {
      var name = Kubernetes.getName(build);
      build.$name = name;

      var nameArray = name.split("-");
      var nameArrayLength = nameArray.length;
      build.$shortName = (nameArrayLength > 4) ? nameArray.slice(0, nameArrayLength - 4).join("-") : name.substring(0, 30);

      var labels = Kubernetes.getLabels(route);
      var creationTimestamp = Kubernetes.getCreationTimestamp(build);
      if (creationTimestamp) {
        var d = new Date(creationTimestamp);
        build.$creationDate = d;
      }
      if (name) {
        build.$viewLink = UrlHelpers.join("workspaces", name, "projects");
      }
    }
    return build;
  }

  export function createWorkspaceBreadcrumbs(children = null) {
    var answer = [
      {
        href: "/workspaces",
        label: "Workspaces",
        title: "View all the workspaces"
      }
    ];
    var workspaceName = Kubernetes.currentKubernetesNamespace();
    if (workspaceName) {
      answer.push(
        {
          href: "/workspaces/" + workspaceName,
          label: workspaceName,
          title: "View the workspace: " + workspaceName
        }
      );
      return processChildren(answer, children);
    }
    return answer;
  }

  export function createProjectBreadcrumbs(projectName = null, children = null) {
    var answer = createWorkspaceBreadcrumbs();
    var workspaceName = Kubernetes.currentKubernetesNamespace();
    if (workspaceName) {
      answer.push(
        {
          href: UrlHelpers.join("/workspaces", workspaceName, "projects"),
          label: "Projects",
          title: "View all the projects"
        }
      );

      if (projectName) {
        answer.push(
          {
            href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName),
            label: projectName,
            title: "View the project: " + projectName
          }
        );
      }
      return processChildren(answer, children);
    }
    return answer;
  }

  export function createProjectSubNavBars(projectName) {
    var workspaceName = Kubernetes.currentKubernetesNamespace();
    return activateCurrent([
      {
        href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName, "builds"),
        label: "Builds",
        title: "View the builds for this project"
      },
      {
        //href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName, "environments"),
        href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName),
        label: "Environments",
        title: "View the environments for this project"
      },
      {
        href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName, "tools"),
        label: "Tools",
        title: "View the tools for this project"
      },
      {
        href: UrlHelpers.join("/workspaces", workspaceName, "projects", projectName, "detail"),
        label: "Detail",
        title: "View the project detail"
      }
    ]);
  }

  /**
   * Removes the URL query string if its inside the given text
   */
  function trimQuery(text) {
    if (text) {
      var idx = text.indexOf("?");
      if (idx >= 0) {
        return text.substring(0, idx);
      }
    }
    return text;
  }

  function activateCurrent(navBarItems) {
    var injector = HawtioCore.injector;
    var $location = injector ? injector.get("$location") : null;
    if ($location) {
      var path = trimQuery($location.path());
      var found = false;
      angular.forEach(navBarItems, (item) => {
        var href = item.href;
        var trimHref = trimQuery(href);
        if (!found && trimHref && trimHref === path) {
          item.active = true;
          found = true;
        }
      });
    }
    return navBarItems;
  }

  function processChildren(answer, children) {
    if (children) {
      if (angular.isArray(children)) {
        answer = answer.concat(children);
      } else {
        answer.push(children);
      }
    }
    activateCurrent(answer);
    return answer;
  }
}