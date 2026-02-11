import { Inbox, Star, Archive, Bookmark, Rss, FolderOpen, Search, Tag } from 'lucide-react';

const states = {
  inbox: {
    icon: Inbox,
    title: 'Your inbox is empty',
    description: 'Add a bookmark to get started',
  },
  all: {
    icon: Bookmark,
    title: 'No bookmarks yet',
    description: 'Add your first bookmark to start building your collection',
  },
  favorites: {
    icon: Star,
    title: 'No favorites yet',
    description: 'Star bookmarks to see them here',
  },
  archive: {
    icon: Archive,
    title: 'Nothing archived',
    description: 'Archived bookmarks will appear here',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try a different search term',
  },
  feed: {
    icon: Rss,
    title: 'No feed items yet',
    description: 'Feed articles will appear here after subscribing',
  },
  collection: {
    icon: FolderOpen,
    title: 'This collection is empty',
    description: 'Move bookmarks here to organize them',
  },
  tag: {
    icon: Tag,
    title: 'No bookmarks with this tag',
    description: 'Tag bookmarks to see them here',
  },
};

export default function EmptyState({ view }) {
  let key = view;
  if (view.startsWith('tag:')) key = 'tag';
  else if (view.startsWith('collection:')) key = 'collection';
  else if (view.startsWith('feed:')) key = 'feed';

  const state = states[key] || states.all;
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Icon size={20} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-1">{state.title}</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{state.description}</p>
    </div>
  );
}
