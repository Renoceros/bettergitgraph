export interface GlossaryTerm {
  term: string;
  title: string;
  definition: string;
  analogy: string;
}

export const GIT_GLOSSARY: Record<string, GlossaryTerm> = {
  commit: {
    term: 'commit',
    title: 'Commit',
    definition: 'A saved snapshot of your project at a specific moment in time with a unique SHA identifier.',
    analogy: 'Like taking a photograph of your documents so you can always revisit that exact version.',
  },
  head: {
    term: 'head',
    title: 'HEAD',
    definition: 'A special pointer indicating the exact commit or branch your workspace is currently looking at.',
    analogy: 'A bookmark indicating what page of your book you are currently reading.',
  },
  branch: {
    term: 'branch',
    title: 'Branch',
    definition: 'An independent line of development that allows you to work on new features without touching main code.',
    analogy: 'A parallel universe or sandbox where you can experiment safely.',
  },
  merge: {
    term: 'merge',
    title: 'Merge',
    definition: 'Combines changes from one branch into another, creating a merge commit if necessary.',
    analogy: 'Pouring water from your experimental cup back into the main pitcher.',
  },
  rebase: {
    term: 'rebase',
    title: 'Rebase',
    definition: 'Moves or replays a series of commits on top of a new base commit for a cleaner, linear history.',
    analogy: 'Lifting your changes up and placing them on top of the newest updates.',
  },
  cherrypick: {
    term: 'cherrypick',
    title: 'Cherry-Pick',
    definition: 'Selects a single commit from another branch and copies its exact changes into your current branch.',
    analogy: 'Picking one apple from another tree and placing it in your basket.',
  },
  stash: {
    term: 'stash',
    title: 'Stash',
    definition: 'Temporarily shelves (saves aside) your uncommitted changes so you can switch branches cleanly.',
    analogy: 'Putting your draft in a desk drawer so you can work on something urgent, then taking it back out later.',
  },
  detached: {
    term: 'detached',
    title: 'Detached HEAD',
    definition: 'When your HEAD points directly to a commit hash instead of a named branch.',
    analogy: 'Browsing an old photo album without creating a new photo yet.',
  },
};
