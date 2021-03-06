/// <reference path="../../tsd/xrm.d.ts" />
module LevelUp {
  window.addEventListener("message", function(event) {
    let utility: LevelUp.Common.Utility;
    let formWindow: Window;
    let formDocument: Document;
    let xrm: Xrm.XrmStatic;

    //home.dynamics.com also messaging. Ignore.
    if (location.origin !== event.origin) return;
    //@ts-ignore
    if (event.source.Xrm && event.data.type) {
      let clientUrl =
        //@ts-ignore
        (event.source.Xrm.Page.context.getCurrentAppUrl &&
          //@ts-ignore
          event.source.Xrm.Page.context.getCurrentAppUrl()) ||
        //@ts-ignore
        event.source.Xrm.Page.context.getClientUrl();
      //This is for differentiating between OnPrem, OnPrem on IFD or CRM Online
      let cleanedClientUrl = !clientUrl.endsWith(
        Xrm.Page.context.getOrgUniqueName()
      )
        ? clientUrl
        : clientUrl.substr(0, clientUrl.lastIndexOf("/"));
      if (!cleanedClientUrl.startsWith(event.origin)) return;
      var clientUrlForParams = clientUrl;
      let contentPanels = Array.from(
        document.querySelectorAll("iframe")
      ).filter(function(d) {
        return d.style.visibility !== "hidden";
      });
      if (!clientUrl.includes("main.aspx")) {
        clientUrlForParams += "/main.aspx";
      }
      //@ts-ignore
      if (event.source.Xrm.Internal.isUci && Xrm.Internal.isUci()) {
        formWindow = window;
        formDocument = document;
        xrm = window.Xrm;
        utility = new LevelUp.Common.Utility(
          formDocument,
          formWindow,
          xrm,
          clientUrl
        );
      } else if (contentPanels && contentPanels.length > 0) {
        formWindow = contentPanels[0].contentWindow;
        formDocument = contentPanels[0].contentDocument;
        xrm = formWindow.Xrm;
        if (!xrm) {
          formWindow = window;
          formDocument = document;
          xrm = window.Xrm;
        }
        utility = new LevelUp.Common.Utility(
          formDocument,
          formWindow,
          xrm,
          clientUrl
        );
      }

      if (
        (<LevelUp.Types.ExtensionMessage>event.data).category === "Forms" &&
        !xrm.Page.data
      ) {
        alert("This command can only be performed in the context of a form");
        return;
      }
      try {
        let message = <LevelUp.Types.ExtensionMessage>event.data;
        switch (message.category) {
          case "Forms":
            new LevelUp.Forms(utility)[message.type]();
            break;
          case "API":
            new LevelUp.Service(utility)[message.type]();
            break;
          case "Grid":
            new LevelUp.Grid(utility)[message.type]();
            break;
          case "Navigation":
            new LevelUp.Navigation(utility)[message.type]();
            break;
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}
