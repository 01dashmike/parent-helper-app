import type { GetServerSideProps, GetServerSidePropsContext } from 'next';

interface Class {
  id: number;
  name: string;
  description?: string;
}

interface ClassesPageProps {
  classes: Class[];
}

export const getServerSideProps: GetServerSideProps<ClassesPageProps> = async (context: GetServerSidePropsContext) => {
  const { query } = context;
  const { town = '', category = '' } = query as { town?: string; category?: string };

  const res = await fetch(`http://localhost:3000/api/classes?town=${town}&category=${category}`);
  const json = await res.json();

  return {
    props: {
      classes: json.data || []
    }
  };
};

export default function ClassesPage({ classes }: ClassesPageProps) {
  return (
    <div>
      <h1>Classes</h1>
      <ul>
        {classes.map((c: Class) => (
          <li key={c.id}>
            <strong>{c.name}</strong><br />
            {c.description}
          </li>
        ))}
      </ul>
    </div>
  );
} 