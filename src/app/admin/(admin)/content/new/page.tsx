import { Metadata } from 'next';
import { ContentForm } from '../ContentForm';

export const metadata: Metadata = {
  title: 'New Content | Lotten Admin',
};

export default function NewContentPage() {
  return <ContentForm isNew={true} />;
}