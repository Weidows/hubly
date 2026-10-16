/**
 * English is the source of truth: every key exists here first.
 * `t()` falls back to English when a translation is missing, so a partially translated locale
 * degrades gracefully instead of showing raw keys.
 */
export const en = {
  'app.name': 'Hubly',

  'tab.repos': 'Repos',
  'tab.papers': 'Papers',
  'tab.blog': 'Blog',
  'tab.saved': 'Saved',
  'tab.me': 'Me',

  'repos.models': 'Models',
  'repos.datasets': 'Datasets',
  'repos.spaces': 'Spaces',
  'repos.trending': 'Trending',
  'repos.search.placeholder': 'Search models, datasets, papers',

  'papers.daily': 'Daily papers',
  'papers.trending': 'Trending papers',

  'common.loading': 'Loading…',
  'common.retry': 'Retry',
  'common.error': 'Something went wrong',
  'common.empty': 'Nothing here yet',
  'common.loadMore': 'Load more',
  'common.cancel': 'Cancel',
  'common.post': 'Post',
  'common.reply': 'Reply',
  'common.save': 'Save',
  'common.copied': 'Copied',
  'common.downloads': 'downloads',
  'common.likes': 'likes',
  'common.comments': 'comments',
  'common.updated': 'Updated',

  'repo.files': 'Files',
  'repo.card': 'Model card',
  'repo.discussions': 'Discussions',
  'repo.collections': 'Collections',
  'repo.open': 'Open',

  'discussion.open': 'Open',
  'discussion.closed': 'Closed',
  'discussion.merged': 'Merged',
  'discussion.new': 'New discussion',
  'discussion.title': 'Title',
  'discussion.body': 'Write a comment…',
  'discussion.empty': 'No discussions yet',

  'auth.signIn': 'Sign in with Hugging Face',
  'auth.signOut': 'Sign out',
  'auth.signedInAs': 'Signed in as',
  'auth.device.title': 'Finish signing in',
  'auth.device.instructions': 'Open the link below and enter this code:',
  'auth.device.open': 'Open browser',
  'auth.device.copy': 'Copy code',
  'auth.device.waiting': 'Waiting for approval…',
  'auth.device.cancelled': 'Sign-in cancelled',
  'auth.device.expired': 'Code expired — try again',
  'auth.needsLogin': 'Sign in to comment or save',
  'auth.scopeNote':
    'Hubly asks only for profile, discussions and collections access. Nothing is stored on a server.',

  'me.notifications': 'Notifications',
  'me.collections': 'My collections',
  'me.likes': 'My likes',
  'me.settings': 'Settings',
  'me.language': 'Language',
  'me.about': 'About',

  'discussion.composer.placeholder': 'Write a comment… markdown works',
  'discussion.post': 'Post',
  'discussion.replyingTo': 'Replying to @{name}',
  'discussion.reply': 'Reply',
  'discussion.cancelReply': 'Cancel',
  'discussion.signInToPost': 'Sign in to join this discussion',
  'discussion.postFailed': 'Could not post — try again',
  'discussion.systemEvent': 'changed the discussion',
  'discussion.reactions': 'React',

  'save.title': 'Save to collection',
  'save.newCollection': 'New collection',
  'save.namePlaceholder': 'Collection name',
  'save.createAndSave': 'Create and save',
  'save.added': 'Saved',
  'save.empty': 'No collections yet — create your first one',
  'save.signIn': 'Sign in to save and comment',
  'collections.title': 'Collections',
  'me.notifications.empty': 'Nothing new',
} as const;
