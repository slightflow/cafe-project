import styled from '@emotion/styled';
import firebase from 'firebase';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import * as yup from 'yup';
import Button from '../components/Button';
import InputField from '../components/InputField';
import OrderItem from '../components/OrderItem';
import Orders from '../components/Orders';
import Seo from '../components/Seo';
import { useSession, withLoader } from '../hooks/auth';
import { useStore } from '../hooks/store';

const Container = styled.div({
  maxWidth: 500,
  margin: '0 auto',
  padding: `50px 20px`,
  minHeight: '80vh',
});

const CardWrapper = styled.div({
  display: 'grid',
  gap: 20,
  gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`,
});

const ItemCard = styled.div({});

const StyledForm = styled(Form)({
  display: 'grid',
  gap: 20,
});

const ResetButton = styled.div({
  textAlign: 'center',
});

const schema = yup.object().shape({
  name: yup.string().required('Please add your name'),
});

function Home() {
  const { selectableDrinks, getDrinkbyId }: any = useStore();
  const { auth, user }: any = useSession();
  const [selectedDrink, setSelectedDrink] = useState(null);

  console.log(auth);

  async function handleSubmit(values) {
    try {
      let userId;
      if (auth) {
        userId = auth?.uid;
      } else {
        const res = await firebase.auth().signInAnonymously();
        console.log(res);
        await firebase
          .firestore()
          .collection(`users`)
          .doc(res?.user?.uid)
          .set({ name: values?.name }, { merge: true });
        userId = res?.user?.uid;
      }
      await firebase
        .firestore()
        .collection(`orders`)
        .add({
          item: getDrinkbyId(selectedDrink),
          ...values,
          status: 'ordered',
          userId,
          meta: {
            createdAt: new Date().valueOf(),
            updatedAt: new Date().valueOf(),
          },
        });
      setSelectedDrink(null);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Seo titles={['Order']} />
      <Container>
        {!selectedDrink && <Orders />}
        <h1>New Order</h1>
        {selectedDrink ? (
          <Formik
            validationSchema={schema}
            initialValues={{ name: user?.name || '' }}
            onSubmit={handleSubmit}
          >
            <StyledForm>
              <OrderItem {...getDrinkbyId(selectedDrink)} />

              <InputField autofocus name='name' placeholder='Name' />
              {/* <InputField name='name' placeHolder='Name' required /> */}
              <Button type='submit'>Place Order</Button>
              <ResetButton>
                <a
                  onClick={() => {
                    if (window.confirm('Restart Order?')) {
                      setSelectedDrink(null);
                    }
                  }}
                >
                  Start Over
                </a>
              </ResetButton>
            </StyledForm>
          </Formik>
        ) : (
          <CardWrapper>
            {selectableDrinks.map((data) => (
              <OrderItem {...data} onClick={() => setSelectedDrink(data?.id)} />
            ))}
          </CardWrapper>
        )}
      </Container>
    </>
  );
}

export default withLoader(Home);
