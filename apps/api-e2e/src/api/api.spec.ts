import axios from 'axios';

describe('GET /api/food-trucks/search', () => {
  it('should return no food trucks', async () => {
    const foodTruckName = 'fiwf;eiafj;eiwajfe;aj;fie;aifjeajfoiij';

    const response = await axios.get(
      `/api/food-trucks/search?name=${foodTruckName}`
    );

    const { data: foodTrucks } = response.data;

    expect(response.status).toBe(200);
    expect(foodTrucks.length).toEqual(0);
  });

  it('should return multiple food trucks', async () => {
    const foodTruckName = 'foo';

    const response = await axios.get(
      `/api/food-trucks/search?name=${foodTruckName}`
    );

    const { data: foodTrucks } = response.data;

    expect(response.status).toBe(200);
    expect(foodTrucks.length).toBeGreaterThan(0);
  });

  it('should return same number of food trucks regardless of case', async () => {
    const foodTruckName = 'Foo';

    const responseLower = await axios.get(
      `/api/food-trucks/search?name=${foodTruckName.toLocaleLowerCase}`
    );

    const { data: foodTrucksLower } = responseLower.data;

    const responseUpper = await axios.get(
      `/api/food-trucks/search?name=${foodTruckName.toLocaleUpperCase}`
    );

    const { data: foodTrucksUpper } = responseUpper.data;

    expect(foodTrucksLower.length).toEqual(foodTrucksUpper.length);
  });
});
