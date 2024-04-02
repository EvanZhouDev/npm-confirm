# `npm` Confirm (`npmc`)

> ✅ Use the right JS package manager without thinking.

![npm Confirm Demo](./art/npmc-demo.png)

## What is `npmc`?

`npmc` is a command line tool that prevents package manager mix-ups in your JS projects.

If you run a command with the wrong package manager, `npmc` will suggest the correct one and reformats the command for your package manager.

All commands that `npmc` may run are shown to you before they are executed, for full transparency.

You can choose to run the corrected command, stick with the original, or just cancel the operation.

Now, you can just copy and paste install code blocks from documentation without needing to change the package manager!

<details>
<summary>Why not `@antfu/ni`?</summary>

**TL;DR**: `npmc` saves you the hassle of needing to manually rewrite commands you copied... it just works running `npm` (and all other major package managers).

I believe that `@antfu/ni` is a great tool for what it does, but it does have a few limitations.

In order to use `ni`, you must modify installation commands that you typically copy from documentation. While it does save you the hassle of having to think of which package manager you're using, it still requires an extra step.

With `npmc`, you can just run the command directly, and have the tool suggest the corrected command for your package manager.

With this method, there's no thinking involved. Additionally, `npmc` shows you the commands that it's running, so you have full control over what you're doing, or not doing.

</details>

## Installation

```bash
npm install -g npm-confirm
```




