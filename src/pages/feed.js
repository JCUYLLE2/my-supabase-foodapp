import { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Button,
  Spinner,
  Row,
  Col,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function FeedPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Controleer of de gebruiker is ingelogd
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    // Wacht tot sessie is bevestigd
    if (!sessionChecked) return;

    const fetchMeals = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          'https://www.themealdb.com/api/json/v1/1/filter.php?i=Chicken'
        );
        const { meals: data } = await res.json();
        setMeals(data || []);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setMeals([]);
      }
      setLoading(false);
    };

    fetchMeals();
  }, [sessionChecked]);

  if (!sessionChecked) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Sessie wordt gecontroleerd…</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Feed</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p>Gerechten aan het laden…</p>
        </div>
      ) : meals.length === 0 ? (
        <p>😕 Geen gerechten gevonden.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {meals.map((meal) => (
            <Col key={meal.idMeal}>
              <Card>
                {meal.strMealThumb && (
                  <Card.Img
                    variant="top"
                    src={meal.strMealThumb}
                    alt={meal.strMeal}
                  />
                )}
                <Card.Body>
                  <Card.Title>{meal.strMeal}</Card.Title>
                  <Button
                    variant="primary"
                    href={`https://www.themealdb.com/meal.php?c=${meal.idMeal}`}
                    target="_blank"
                  >
                    Bekijk recept
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
