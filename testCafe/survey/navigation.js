import { frameworks, url, initSurvey } from "../helper";
import { ClientFunction, fixture, Selector, test } from "testcafe";
// eslint-disable-next-line no-undef
const assert = require("assert");
const title = "navigation";

const json = {
  pages: [
    {
      elements: [
        {
          name: "question4a",
          type: "text",
          title: "Question",
        },
      ]
    }
  ]
};

frameworks.forEach((framework) => {
  fixture`${framework} ${title}`.page`${url}${framework}`.beforeEach(
    async (t) => {
      await initSurvey(framework, json);
    }
  );

  test("check disable/enable navigation item", async (t) => {
    const btnSelector = Selector("#sv-nav-complete input");
    await t.expect(btnSelector.hasAttribute("disabled")).notOk();
    await ClientFunction(() => { window.survey.navigationBarValue.actions[4].enabled = false; })();
    await t.expect(btnSelector.hasAttribute("disabled")).ok();
    await ClientFunction(() => { window.survey.navigationBarValue.actions[4].enabled = true; })();
    await t.expect(btnSelector.hasAttribute("disabled")).notOk();
  });
});
